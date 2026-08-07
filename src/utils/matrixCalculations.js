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

/**
 * Simule une séquence de tir PAS À PAS, en respectant :
 *  - le franchissement conditionné par les places d'entrée
 *  - les arcs inhibiteurs (présence d'un arc inhibiteur P→T :
 *    T ne peut être tirée que si P est vide)
 *  - les capacités des places
 *
 * @param {number[]} M0 - marquage initial
 * @param {number[][]} W - matrice d'incidence
 * @param {number[]} S - vecteur de compte (pour la formule algébrique)
 * @param {string[]} labels - libellés des transitions dans l'ordre de S
 * @param {string[]} sequence - séquence ordonnée des transitions à tirer
 * @param {Object} ctx - { edges, transitionIds, places }
 * @returns {{ marking: number[], feasible: boolean, failedAt: number|null, failedLabel: string|null, steps: Array }}
 */
export function simulateSequence(M0, sequence, ctx) {
  const { edges, transitionIds, transitionLabels, places } = ctx;
  const marking = M0.slice();
  const steps = [{ index: 0, label: null, marking: marking.slice() }];

  const transIndexByLabel = new Map(
    transitionLabels.map((label, i) => [label, i])
  );

  for (let step = 0; step < sequence.length; step++) {
    const label = sequence[step];
    const tIdx = transIndexByLabel.get(label);

    if (tIdx === undefined) {
      return {
        marking,
        feasible: false,
        failedAt: step,
        failedLabel: label,
        reason: 'unknown',
        steps,
      };
    }

    const transId = transitionIds[tIdx];

    // Vérifier la franchissabilité (y compris arcs inhibiteurs)
    const incoming = edges.filter((e) => e.target === transId);
    let enabled = true;
    let blockingReason = null;

    for (const edge of incoming) {
      const placeIdx = places.findIndex((p) => p.id === edge.source);
      if (placeIdx === -1) continue;
      if (edge.data?.type === EDGE_TYPES.INHIBITOR) {
        if (marking[placeIdx] !== 0) {
          enabled = false;
          blockingReason = `arc inhibiteur depuis ${places[placeIdx].data.label} non vide`;
          break;
        }
      } else {
        const weight = edge.data?.weight || 1;
        if (marking[placeIdx] < weight) {
          enabled = false;
          blockingReason = `pas assez de jetons dans ${places[placeIdx].data.label}`;
          break;
        }
      }
    }

    if (!enabled) {
      return {
        marking,
        feasible: false,
        failedAt: step,
        failedLabel: label,
        reason: blockingReason,
        steps,
      };
    }

    // Mettre à jour le marquage
    incoming.forEach((edge) => {
      if (edge.data?.type === EDGE_TYPES.INHIBITOR) return;
      const placeIdx = places.findIndex((p) => p.id === edge.source);
      if (placeIdx === -1) return;
      marking[placeIdx] -= edge.data?.weight || 1;
    });

    edges
      .filter((e) => e.source === transId && e.data?.type !== EDGE_TYPES.INHIBITOR)
      .forEach((edge) => {
        const placeIdx = places.findIndex((p) => p.id === edge.target);
        if (placeIdx === -1) return;
        const weight = edge.data?.weight || 1;
        const cap = places[placeIdx].data.capacity;
        const next = marking[placeIdx] + weight;
        marking[placeIdx] = cap !== Infinity ? Math.min(next, cap) : next;
      });

    steps.push({ index: step + 1, label, marking: marking.slice() });

    if (marking.some((v) => v < 0)) {
      return {
        marking,
        feasible: false,
        failedAt: step,
        failedLabel: label,
        reason: 'negative-marking',
        steps,
      };
    }
  }

  return {
    marking,
    feasible: true,
    failedAt: null,
    failedLabel: null,
    reason: null,
    steps,
  };
}