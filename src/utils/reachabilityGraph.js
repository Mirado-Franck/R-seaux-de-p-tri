import { NODE_TYPES, EDGE_TYPES } from '../constants/defaults';
import { computeIncidenceMatrices, computeEvolution, isValidMarking } from './matrixCalculations';

/**
 * Génère le graphe de marquage (accessibilité)
 * @param {Array} nodes - nœuds du réseau
 * @param {Array} edges - arcs du réseau
 * @param {number} maxStates - nombre maximum d'états à explorer (sécurité)
 * @returns {Object} - { states: [{id, marking, label}], transitions: [{from, to, label}] }
 */
export function generateReachabilityGraph(nodes, edges, maxStates = 200) {
  const places = nodes
    .filter((n) => n.type === NODE_TYPES.PLACE)
    .sort((a, b) => a.data.label.localeCompare(b.data.label, undefined, { numeric: true }));
  const transitions = nodes
    .filter((n) => n.type === NODE_TYPES.TRANSITION)
    .sort((a, b) => a.data.label.localeCompare(b.data.label, undefined, { numeric: true }));

  const placeIds = places.map((p) => p.id);
  const transitionIds = transitions.map((t) => t.id);

  const { Pre, Post, W } = computeIncidenceMatrices(nodes, edges);

  // Marquage initial
  const M0 = places.map((p) => p.data.tokens);
  const m0Key = M0.join(',');

  const states = [{ id: 'm0', marking: M0, label: `(${M0.join(', ')})` }];
  const stateMap = new Map([[m0Key, 'm0']]);
  const graphTransitions = [];
  const queue = [{ marking: M0, id: 'm0' }];
  let stateCounter = 1;

  while (queue.length > 0 && states.length < maxStates) {
    const current = queue.shift();

    // Pour chaque transition, vérifier si elle est franchissable
    for (let t = 0; t < transitions.length; t++) {
      const transId = transitionIds[t];
      
      // Vérifier si la transition est franchissable depuis ce marquage
      if (!isTransitionEnabledAtMarking(current.marking, t, Pre, edges, placeIds, transId, nodes)) {
        continue;
      }

      // Tirer la transition
      const firingVector = new Array(transitions.length).fill(0);
      firingVector[t] = 1;
      const newMarking = computeEvolution(current.marking, W, firingVector);

      // Vérifier validité
      if (!isValidMarking(newMarking)) continue;

      // Vérifier les capacités
      const capacityOk = places.every((p, i) => {
        return p.data.capacity === Infinity || newMarking[i] <= p.data.capacity;
      });
      if (!capacityOk) continue;

      const newKey = newMarking.join(',');
      let targetId;

      if (stateMap.has(newKey)) {
        targetId = stateMap.get(newKey);
      } else {
        targetId = `m${stateCounter++}`;
        stateMap.set(newKey, targetId);
        states.push({
          id: targetId,
          marking: newMarking,
          label: `(${newMarking.join(', ')})`,
        });
        queue.push({ marking: newMarking, id: targetId });
      }

      graphTransitions.push({
        from: current.id,
        to: targetId,
        label: transitions[t].data.label,
      });
    }
  }

  const truncated = states.length >= maxStates;

  return { states, transitions: graphTransitions, truncated };
}

/**
 * Vérifie si une transition est franchissable pour un marquage donné
 */
function isTransitionEnabledAtMarking(marking, transIndex, Pre, edges, placeIds, transId, nodes) {
  // Récupérer les arcs entrants vers cette transition
  const incomingEdges = edges.filter((e) => e.target === transId);

  // Si pas d'arcs entrants → transition source → toujours franchissable
  if (incomingEdges.length === 0) return true;

  for (const edge of incomingEdges) {
    const placeIndex = placeIds.indexOf(edge.source);
    if (placeIndex === -1) continue;

    if (edge.data?.type === EDGE_TYPES.INHIBITOR) {
      // Arc inhibiteur: la place doit être vide
      if (marking[placeIndex] !== 0) return false;
    } else {
      // Arc normal: vérifier les jetons
      const weight = edge.data?.weight || 1;
      if (marking[placeIndex] < weight) return false;
    }
  }

  return true;
}

/**
 * Détecte les deadlocks (états sans transitions franchissables)
 */
export function findDeadlocks(reachabilityGraph) {
  const { states, transitions } = reachabilityGraph;
  const statesWithOutgoing = new Set(transitions.map((t) => t.from));
  return states.filter((s) => !statesWithOutgoing.has(s.id));
}