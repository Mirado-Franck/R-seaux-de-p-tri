import { NODE_TYPES, EDGE_TYPES } from '../constants/defaults';

/**
 * Génère les matrices Pre, Post et W pour un réseau de Petri
 */
export function computeIncidenceMatrices(nodes, edges) {
  const places = nodes
    .filter((n) => n.type === NODE_TYPES.PLACE)
    .sort((a, b) => a.data.label.localeCompare(b.data.label, undefined, { numeric: true }));
  const transitions = nodes
    .filter((n) => n.type === NODE_TYPES.TRANSITION)
    .sort((a, b) => a.data.label.localeCompare(b.data.label, undefined, { numeric: true }));

  const placeIds = places.map((p) => p.id);
  const transitionIds = transitions.map((t) => t.id);
  const placeLabels = places.map((p) => p.data.label);
  const transitionLabels = transitions.map((t) => t.data.label);

  const m = places.length;    // rows
  const n = transitions.length; // cols

  // Initialiser les matrices à zéro
  const Pre = Array.from({ length: m }, () => Array(n).fill(0));
  const Post = Array.from({ length: m }, () => Array(n).fill(0));

  edges.forEach((edge) => {
    if (edge.data?.type === EDGE_TYPES.INHIBITOR) return; // Ignorer les arcs inhibiteurs

    const sourceIdx = placeIds.indexOf(edge.source);
    const targetTransIdx = transitionIds.indexOf(edge.target);
    const sourceTransIdx = transitionIds.indexOf(edge.source);
    const targetPlaceIdx = placeIds.indexOf(edge.target);
    const weight = edge.data?.weight || 1;

    if (sourceIdx !== -1 && targetTransIdx !== -1) {
      // Arc: Place → Transition (entrée) → Pre
      Pre[sourceIdx][targetTransIdx] = weight;
    } else if (sourceTransIdx !== -1 && targetPlaceIdx !== -1) {
      // Arc: Transition → Place (sortie) → Post
      Post[targetPlaceIdx][sourceTransIdx] = weight;
    }
  });

  // Matrice d'incidence W = Post - Pre
  const W = Array.from({ length: m }, (_, i) =>
    Array.from({ length: n }, (_, j) => Post[i][j] - Pre[i][j])
  );

  return {
    Pre,
    Post,
    W,
    placeLabels,
    transitionLabels,
    placeIds,
    transitionIds,
  };
}

/**
 * Calcul de l'évolution : Mk = Mi + W · S^T
 * @param {number[]} Mi - marquage initial (vecteur)
 * @param {number[][]} W - matrice d'incidence
 * @param {number[]} S - vecteur de séquence de tir (nombre de fois que chaque transition est tirée)
 * @returns {number[]} - nouveau marquage
 */
export function computeEvolution(Mi, W, S) {
  const m = W.length;
  const n = W[0].length;

  // W · S^T (multiplication matrice × vecteur)
  const result = new Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      result[i] += W[i][j] * S[j];
    }
  }

  // Mi + W·S^T
  return Mi.map((val, i) => val + result[i]);
}

/**
 * Vérifie si un marquage est valide (pas de jetons négatifs)
 */
export function isValidMarking(marking) {
  return marking.every((m) => m >= 0);
}

/**
 * Calcul de la séquence de tir à partir de l'historique
 */
export function firingSequenceToVector(sequence, transitionLabels) {
  const vector = new Array(transitionLabels.length).fill(0);
  sequence.forEach((label) => {
    const idx = transitionLabels.indexOf(label);
    if (idx !== -1) vector[idx]++;
  });
  return vector;
}