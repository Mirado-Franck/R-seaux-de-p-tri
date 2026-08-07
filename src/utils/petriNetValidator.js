import { NODE_TYPES, EDGE_TYPES } from '../constants/defaults';

/**
 * Validation complète d'un réseau de Petri
 * Retourne un objet avec les erreurs, avertissements et suggestions
 */
export function validatePetriNet(nodes, edges) {
  const errors = [];      // Problèmes graves qui rendent le réseau invalide
  const warnings = [];    // Points d'attention (pas forcément des erreurs)
  const info = [];        // Informations utiles

  const places = nodes.filter((n) => n.type === NODE_TYPES.PLACE);
  const transitions = nodes.filter((n) => n.type === NODE_TYPES.TRANSITION);

  // ============================================
  // 1. VALIDATION STRUCTURELLE DE BASE
  // ============================================

  // Réseau vide
  if (nodes.length === 0) {
    errors.push({
      code: 'EMPTY_NET',
      message: 'Le réseau est vide. Ajoutez au moins une place et une transition.',
    });
    return { errors, warnings, info, isValid: false };
  }

  // Pas de places
  if (places.length === 0) {
    errors.push({
      code: 'NO_PLACES',
      message: 'Le réseau ne contient aucune place. Ajoutez au moins une place.',
    });
  }

  // Pas de transitions
  if (transitions.length === 0) {
    errors.push({
      code: 'NO_TRANSITIONS',
      message: 'Le réseau ne contient aucune transition. Ajoutez au moins une transition.',
    });
  }

  // Pas d'arcs
  if (edges.length === 0 && nodes.length > 0) {
    errors.push({
      code: 'NO_ARCS',
      message: 'Aucun arc ne relie les éléments. Le réseau est déconnecté.',
    });
  }

  // ============================================
  // 2. VALIDATION DES ARCS (règle bipartite)
  // ============================================

  edges.forEach((edge) => {
    const source = nodes.find((n) => n.id === edge.source);
    const target = nodes.find((n) => n.id === edge.target);

    if (!source || !target) {
      errors.push({
        code: 'INVALID_ARC',
        message: `Arc ${edge.id} pointe vers un nœud inexistant.`,
      });
      return;
    }

    // Un arc doit relier Place↔Transition (bipartite)
    if (source.type === target.type) {
      errors.push({
        code: 'INVALID_BIPARTITE',
        message: `Arc invalide : ${source.data.label} → ${target.data.label} (${source.type} → ${target.type}). Un arc doit relier une place et une transition.`,
      });
    }

    // Arc inhibiteur : uniquement Place → Transition
    if (edge.data?.type === EDGE_TYPES.INHIBITOR) {
      if (source.type !== NODE_TYPES.PLACE || target.type !== NODE_TYPES.TRANSITION) {
        errors.push({
          code: 'INVALID_INHIBITOR',
          message: `Arc inhibiteur invalide : ${source.data.label} → ${target.data.label}. Doit aller d'une place vers une transition.`,
        });
      }
    }

    // Poids valide
    const weight = edge.data?.weight || 1;
    if (weight < 1 || !Number.isInteger(weight)) {
      errors.push({
        code: 'INVALID_WEIGHT',
        message: `Arc ${source.data.label} → ${target.data.label} : poids invalide (${weight}). Doit être un entier ≥ 1.`,
      });
    }
  });

  // ============================================
  // 3. VALIDATION DES NŒUDS ISOLÉS
  // ============================================

  const connectedNodeIds = new Set();
  edges.forEach((e) => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  const isolatedNodes = nodes.filter((n) => !connectedNodeIds.has(n.id));
  isolatedNodes.forEach((n) => {
    warnings.push({
      code: 'ISOLATED_NODE',
      message: `${n.type === NODE_TYPES.PLACE ? 'Place' : 'Transition'} "${n.data.label}" est isolé(e) (aucun arc connecté).`,
      nodeId: n.id,
    });
  });

  // ============================================
  // 4. VALIDATION DES PLACES
  // ============================================

  places.forEach((place) => {
    // Jetons négatifs
    if (place.data.tokens < 0) {
      errors.push({
        code: 'NEGATIVE_TOKENS',
        message: `Place "${place.data.label}" a un nombre de jetons négatif (${place.data.tokens}).`,
        nodeId: place.id,
      });
    }

    // Jetons non entiers
    if (!Number.isInteger(place.data.tokens)) {
      errors.push({
        code: 'NON_INTEGER_TOKENS',
        message: `Place "${place.data.label}" a un nombre de jetons non entier.`,
        nodeId: place.id,
      });
    }

    // Capacité dépassée dès le départ
    if (place.data.capacity !== Infinity && place.data.tokens > place.data.capacity) {
      errors.push({
        code: 'CAPACITY_EXCEEDED',
        message: `Place "${place.data.label}" a ${place.data.tokens} jetons mais sa capacité est ${place.data.capacity}.`,
        nodeId: place.id,
      });
    }

    // Capacité invalide
    if (place.data.capacity !== Infinity && place.data.capacity < 1) {
      errors.push({
        code: 'INVALID_CAPACITY',
        message: `Place "${place.data.label}" a une capacité invalide (${place.data.capacity}).`,
        nodeId: place.id,
      });
    }
  });

  // ============================================
  // 5. VALIDATION DES TRANSITIONS
  // ============================================

  transitions.forEach((trans) => {
    const incomingEdges = edges.filter((e) => e.target === trans.id);
    const outgoingEdges = edges.filter((e) => e.source === trans.id);

    // Transition source (pas d'entrées) → attention
    if (incomingEdges.length === 0 && outgoingEdges.length > 0) {
      info.push({
        code: 'SOURCE_TRANSITION',
        message: `Transition "${trans.data.label}" est une transition SOURCE (toujours franchissable) — génère des jetons.`,
        nodeId: trans.id,
      });
    }

    // Transition puits (pas de sorties) → attention
    if (outgoingEdges.length === 0 && incomingEdges.length > 0) {
      info.push({
        code: 'SINK_TRANSITION',
        message: `Transition "${trans.data.label}" est une transition PUITS — consomme des jetons sans en produire.`,
        nodeId: trans.id,
      });
    }

    // Transition complètement isolée (aucun arc)
    if (incomingEdges.length === 0 && outgoingEdges.length === 0) {
      warnings.push({
        code: 'DEAD_TRANSITION_STRUCTURAL',
        message: `Transition "${trans.data.label}" n'a aucun arc — elle ne fait rien.`,
        nodeId: trans.id,
      });
    }
  });

  // ============================================
  // 6. NOMS DUPLIQUÉS
  // ============================================

  const placeNames = places.map((p) => p.data.label);
  const transNames = transitions.map((t) => t.data.label);

  const duplicatePlaces = placeNames.filter((n, i) => placeNames.indexOf(n) !== i);
  const duplicateTrans = transNames.filter((n, i) => transNames.indexOf(n) !== i);

  [...new Set(duplicatePlaces)].forEach((name) => {
    warnings.push({
      code: 'DUPLICATE_PLACE_NAME',
      message: `Plusieurs places portent le nom "${name}".`,
    });
  });

  [...new Set(duplicateTrans)].forEach((name) => {
    warnings.push({
      code: 'DUPLICATE_TRANSITION_NAME',
      message: `Plusieurs transitions portent le nom "${name}".`,
    });
  });

  // ============================================
  // 7. CONNEXITÉ DU RÉSEAU
  // ============================================

  if (nodes.length > 1 && edges.length > 0) {
    const components = findConnectedComponents(nodes, edges);
    if (components.length > 1) {
      warnings.push({
        code: 'DISCONNECTED_NET',
        message: `Le réseau est composé de ${components.length} sous-réseaux non connectés.`,
      });
    }
  }

  // ============================================
  // 8. MARQUAGE INITIAL
  // ============================================

  const totalTokens = places.reduce((sum, p) => sum + p.data.tokens, 0);
  if (totalTokens === 0 && places.length > 0) {
    warnings.push({
      code: 'NO_INITIAL_MARKING',
      message: 'Le marquage initial est vide (aucun jeton). Aucune transition ne pourra être tirée (sauf transitions sources).',
    });
  }

  // ============================================
  // RÉSUMÉ
  // ============================================

  const isValid = errors.length === 0;

  return {
    errors,
    warnings,
    info,
    isValid,
    stats: {
      places: places.length,
      transitions: transitions.length,
      arcs: edges.filter((e) => e.data?.type !== EDGE_TYPES.INHIBITOR).length,
      inhibitorArcs: edges.filter((e) => e.data?.type === EDGE_TYPES.INHIBITOR).length,
      totalTokens,
      isolatedNodes: isolatedNodes.length,
    },
  };
}

/**
 * Trouve les composantes connexes du graphe (algo Union-Find)
 */
function findConnectedComponents(nodes, edges) {
  const parent = {};
  nodes.forEach((n) => (parent[n.id] = n.id));

  const find = (x) => {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };

  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  edges.forEach((e) => union(e.source, e.target));

  const components = {};
  nodes.forEach((n) => {
    const root = find(n.id);
    if (!components[root]) components[root] = [];
    components[root].push(n.id);
  });

  return Object.values(components);
}