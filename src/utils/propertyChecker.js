import { generateReachabilityGraph, findDeadlocks } from './reachabilityGraph';
import { NODE_TYPES, EDGE_TYPES } from '../constants/defaults';

/**
 * Vérifie le bornage du réseau
 */
export function checkBoundedness(nodes, edges) {
  const rg = generateReachabilityGraph(nodes, edges, 500);
  const places = nodes
    .filter((n) => n.type === NODE_TYPES.PLACE)
    .sort((a, b) => a.data.label.localeCompare(b.data.label, undefined, { numeric: true }));

  if (rg.truncated) {
    return {
      bounded: false,
      safe: false,
      message: 'Le graphe de marquage est trop grand (potentiellement non borné).',
      details: {},
      truncated: true,
    };
  }

  const maxTokens = {};
  places.forEach((p, i) => {
    maxTokens[p.data.label] = 0;
    rg.states.forEach((state) => {
      maxTokens[p.data.label] = Math.max(maxTokens[p.data.label], state.marking[i]);
    });
  });

  const bounded = Object.values(maxTokens).every((v) => v < Infinity);
  const safe = Object.values(maxTokens).every((v) => v <= 1);

  let kBounded = 0;
  if (bounded) {
    kBounded = Math.max(...Object.values(maxTokens));
  }

  return {
    bounded,
    safe,
    kBounded,
    maxTokens,
    stateCount: rg.states.length,
    message: safe
      ? 'Le réseau est sauf (1-borné) : chaque place contient au maximum 1 jeton.'
      : bounded
        ? `Le réseau est ${kBounded}-borné.`
        : 'Le réseau n\'est pas borné.',
    truncated: false,
  };
}

/**
 * Vérifie la vivacité et les deadlocks
 */
export function checkLiveness(nodes, edges) {
  const rg = generateReachabilityGraph(nodes, edges, 500);
  const deadlocks = findDeadlocks(rg);
  const transitions = nodes
    .filter((n) => n.type === NODE_TYPES.TRANSITION)
    .sort((a, b) => a.data.label.localeCompare(b.data.label, undefined, { numeric: true }));

  // Transitions qui apparaissent dans le graphe
  const firedTransitions = new Set(rg.transitions.map((t) => t.label));
  const deadTransitions = transitions
    .filter((t) => !firedTransitions.has(t.data.label))
    .map((t) => t.data.label);

  // Quasi-vivacité: toutes les transitions peuvent être tirées au moins une fois
  const quasiLive = deadTransitions.length === 0;

  const hasDeadlock = deadlocks.length > 0;

  return {
    hasDeadlock,
    deadlocks: deadlocks.map((d) => d.label),
    deadlockCount: deadlocks.length,
    quasiLive,
    deadTransitions,
    stateCount: rg.states.length,
    transitionCount: rg.transitions.length,
    message: hasDeadlock
      ? `${deadlocks.length} blocage(s) détecté(s).`
      : 'Aucun blocage détecté.',
    truncated: rg.truncated,
  };
}

/**
 * Détecte les conflits structurels
 */
export function detectConflicts(nodes, edges) {
  const places = nodes.filter((n) => n.type === NODE_TYPES.PLACE);
  const conflicts = [];

  places.forEach((place) => {
    // Trouver toutes les transitions en sortie de cette place
    const outgoingEdges = edges.filter(
      (e) => e.source === place.id && e.data?.type !== EDGE_TYPES.INHIBITOR
    );
    const targetTransitions = outgoingEdges
      .map((e) => {
        const trans = nodes.find((n) => n.id === e.target && n.type === NODE_TYPES.TRANSITION);
        return trans ? { transition: trans, weight: e.data?.weight || 1 } : null;
      })
      .filter(Boolean);

    if (targetTransitions.length >= 2) {
      // Conflit structurel
      const totalWeight = targetTransitions.reduce((sum, t) => sum + t.weight, 0);
      const isEffective = place.data.tokens < totalWeight && place.data.tokens > 0;

      conflicts.push({
        place: place.data.label,
        placeId: place.id,
        transitions: targetTransitions.map((t) => ({
          label: t.transition.data.label,
          weight: t.weight,
        })),
        isEffective,
        tokens: place.data.tokens,
      });
    }
  });

  return {
    conflicts,
    hasConflicts: conflicts.length > 0,
    effectiveConflicts: conflicts.filter((c) => c.isEffective),
    message: conflicts.length > 0
      ? `${conflicts.length} conflit(s) structurel(s) détecté(s), dont ${conflicts.filter((c) => c.isEffective).length} effectif(s).`
      : 'Aucun conflit détecté.',
  };
}