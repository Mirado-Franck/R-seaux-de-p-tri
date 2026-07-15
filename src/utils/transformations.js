import { nanoid } from 'nanoid';
import { NODE_TYPES, EDGE_TYPES } from '../constants/defaults';

/**
 * Transforme un RdP impur en RdP pur
 * Un RdP est impur s'il existe un arc d'une place P vers une transition T
 * ET un arc de T vers P (boucle). On ajoute une place intermédiaire P0.
 */
export function transformImpureToPure(nodes, edges) {
  const newNodes = [...nodes];
  const newEdges = [...edges];
  const loops = [];

  // Détecter les boucles (P → T et T → P)
  edges.forEach((e1) => {
    edges.forEach((e2) => {
      if (
        e1.source !== e2.target || e1.target !== e2.source ||
        e1.id === e2.id
      ) return;

      const sourceNode = nodes.find((n) => n.id === e1.source);
      const targetNode = nodes.find((n) => n.id === e1.target);

      if (
        sourceNode?.type === NODE_TYPES.PLACE &&
        targetNode?.type === NODE_TYPES.TRANSITION
      ) {
        const already = loops.find(
          (l) => l.placeId === e1.source && l.transId === e1.target
        );
        if (!already) {
          loops.push({
            placeId: e1.source,
            transId: e1.target,
            placeToTrans: e1,
            transToPlace: e2,
          });
        }
      }
    });
  });

  if (loops.length === 0) {
    return { nodes, edges, transformed: false, message: 'Le réseau est déjà pur.' };
  }

  loops.forEach((loop, index) => {
    const place = nodes.find((n) => n.id === loop.placeId);
    const trans = nodes.find((n) => n.id === loop.transId);

    // Créer une place intermédiaire P0
    const p0Id = `place-p0-${nanoid(8)}`;
    const p0 = {
      id: p0Id,
      type: NODE_TYPES.PLACE,
      position: {
        x: (place.position.x + trans.position.x) / 2,
        y: place.position.y - 80 - index * 40,
      },
      data: {
        label: `P0_${index + 1}`,
        tokens: loop.transToPlace.data?.weight || 1,
        capacity: Infinity,
      },
    };
    newNodes.push(p0);

    // Supprimer les arcs de la boucle
    const removeIds = new Set([loop.placeToTrans.id, loop.transToPlace.id]);

    // Nouveaux arcs: P0 → T et T → P0 + P → T reste mais modifié
    // Schéma: P → T (gardé), T → P0 (nouveau), P0 → T (nouveau, remplace T → P)
    const arcP0ToT = {
      id: `e-${nanoid(8)}`,
      source: p0Id,
      target: loop.transId,
      type: 'arc',
      data: { weight: loop.placeToTrans.data?.weight || 1, type: EDGE_TYPES.ARC },
      markerEnd: { type: 'arrowclosed', color: '#374151' },
    };

    const arcTToP0 = {
      id: `e-${nanoid(8)}`,
      source: loop.transId,
      target: p0Id,
      type: 'arc',
      data: { weight: loop.transToPlace.data?.weight || 1, type: EDGE_TYPES.ARC },
      markerEnd: { type: 'arrowclosed', color: '#374151' },
    };

    // Filtrer les anciens arcs de boucle
    const filteredEdges = newEdges.filter((e) => !removeIds.has(e.id));
    newEdges.length = 0;
    newEdges.push(...filteredEdges, arcP0ToT, arcTToP0);
  });

  return {
    nodes: newNodes,
    edges: newEdges,
    transformed: true,
    loopsFound: loops.length,
    message: `${loops.length} boucle(s) transformée(s). ${loops.length} place(s) intermédiaire(s) ajoutée(s).`,
  };
}

/**
 * Transforme un RdP à capacité en RdP ordinaire
 * Pour chaque place P avec capacité K, on ajoute une place complémentaire P'
 * avec K - tokens(P) jetons, et on inverse les arcs.
 */
export function transformCapacityToOrdinary(nodes, edges) {
  const placesWithCapacity = nodes.filter(
    (n) => n.type === NODE_TYPES.PLACE && n.data.capacity !== Infinity
  );

  if (placesWithCapacity.length === 0) {
    return { nodes, edges, transformed: false, message: 'Aucune place avec capacité trouvée.' };
  }

  const newNodes = nodes.map((n) => {
    if (n.type === NODE_TYPES.PLACE && n.data.capacity !== Infinity) {
      return { ...n, data: { ...n.data, capacity: Infinity } };
    }
    return n;
  });
  const newEdges = [...edges];

  placesWithCapacity.forEach((place) => {
    const K = place.data.capacity;
    const complementId = `place-comp-${nanoid(8)}`;

    // Place complémentaire
    const complement = {
      id: complementId,
      type: NODE_TYPES.PLACE,
      position: {
        x: place.position.x,
        y: place.position.y + 120,
      },
      data: {
        label: `${place.data.label}'`,
        tokens: K - place.data.tokens,
        capacity: Infinity,
      },
    };
    newNodes.push(complement);

    // Pour chaque arc entrant dans P (T → P), ajouter un arc P' → T
    const incomingArcs = edges.filter(
      (e) => e.target === place.id && e.data?.type !== EDGE_TYPES.INHIBITOR
    );
    incomingArcs.forEach((arc) => {
      newEdges.push({
        id: `e-${nanoid(8)}`,
        source: complementId,
        target: arc.source,
        type: 'arc',
        data: { weight: arc.data?.weight || 1, type: EDGE_TYPES.ARC },
        markerEnd: { type: 'arrowclosed', color: '#374151' },
      });
    });

    // Pour chaque arc sortant de P (P → T), ajouter un arc T → P'
    const outgoingArcs = edges.filter(
      (e) => e.source === place.id && e.data?.type !== EDGE_TYPES.INHIBITOR
    );
    outgoingArcs.forEach((arc) => {
      newEdges.push({
        id: `e-${nanoid(8)}`,
        source: arc.target,
        target: complementId,
        type: 'arc',
        data: { weight: arc.data?.weight || 1, type: EDGE_TYPES.ARC },
        markerEnd: { type: 'arrowclosed', color: '#374151' },
      });
    });
  });

  return {
    nodes: newNodes,
    edges: newEdges,
    transformed: true,
    placesTransformed: placesWithCapacity.length,
    message: `${placesWithCapacity.length} place(s) à capacité transformée(s) en places ordinaires.`,
  };
}