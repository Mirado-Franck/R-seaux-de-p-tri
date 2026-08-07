import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { TOOL_MODES, NODE_TYPES, EDGE_TYPES } from '../constants/defaults';

// ===== Helpers hors store (purs, synchrones) =====

const getPlaceNames = (nodes) =>
  nodes
    .filter((n) => n.type === NODE_TYPES.PLACE)
    .map((n) => n.data.label);

const getTransitionNames = (nodes) =>
  nodes
    .filter((n) => n.type === NODE_TYPES.TRANSITION)
    .map((n) => n.data.label);

/**
 * Génère un nom unique du type P1/P2... ou T1/T2... en évitant les doublons,
 * même quand l'utilisateur a renommé des nœuds manuellement.
 */
const getNextName = (nodes, type) => {
  const prefix = type === NODE_TYPES.PLACE ? 'P' : 'T';
  const used = new Set(
    type === NODE_TYPES.PLACE ? getPlaceNames(nodes) : getTransitionNames(nodes)
  );
  // On récupère aussi les numéros déjà présents pour continuer la numérotation
  const numbers = [];
  used.forEach((name) => {
    const m = name.match(new RegExp(`^${prefix}(\\d+)$`));
    if (m) numbers.push(parseInt(m[1], 10));
  });
  let i = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  while (used.has(`${prefix}${i}`)) i++;
  return `${prefix}${i}`;
};

/**
 * Renvoie un libellé unique si celui proposé est déjà pris.
 * Ignoré quand le nœud édité est lui-même celui qui porte déjà le nom.
 */
const uniqueLabel = (nodes, type, wanted, exceptId = null) => {
  const used = new Set(
    nodes
      .filter((n) => n.type === type && n.id !== exceptId)
      .map((n) => n.data.label)
  );
  if (!used.has(wanted)) return wanted;
  // Essaie wanted (2), wanted (3)...
  let i = 2;
  while (used.has(`${wanted} (${i})`)) i++;
  return `${wanted} (${i})`;
};

/**
 * Applique le clamp [0, capacité] d'un coup, sans setTimeout.
 */
const clampTokens = (tokens, capacity) => {
  const t = Math.max(0, Math.floor(tokens) || 0);
  return capacity !== Infinity ? Math.min(t, capacity) : t;
};

/**
 * Recalcule l'état "franchissable" de toutes les transitions.
 * Fonction pure — retourne un nouveau tableau de nœuds.
 */
const recomputeEnabled = (nodes, edges) => {
  const incomingByTransition = new Map();
  edges.forEach((e) => {
    if (!incomingByTransition.has(e.target)) incomingByTransition.set(e.target, []);
    incomingByTransition.get(e.target).push(e);
  });
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  let changed = false;
  const next = nodes.map((n) => {
    if (n.type !== NODE_TYPES.TRANSITION) return n;
    const incoming = incomingByTransition.get(n.id) || [];
    let enabled = true;
    for (const edge of incoming) {
      const place = nodeById.get(edge.source);
      if (!place) continue;
      if (edge.data?.type === EDGE_TYPES.INHIBITOR) {
        if (place.data.tokens !== 0) { enabled = false; break; }
      } else {
        if (place.data.tokens < (edge.data?.weight || 1)) { enabled = false; break; }
      }
    }
    if (n.data.enabled === enabled) return n;
    changed = true;
    return { ...n, data: { ...n.data, enabled } };
  });
  return changed ? next : nodes;
};

const usePetriStore = create((set, get) => ({
  // ===== NODES & EDGES (React Flow) =====
  nodes: [],
  edges: [],

  // ===== TOOL MODE =====
  toolMode: TOOL_MODES.SELECT,
  setToolMode: (mode) => set({ toolMode: mode }),

  // ===== ARC CREATION STATE =====
  arcSource: null,
  setArcSource: (nodeId) => set({ arcSource: nodeId }),

  // ===== SELECTED ELEMENT =====
  selectedElement: null,
  setSelectedElement: (element) => set({ selectedElement: element }),

  // ===== REACT FLOW CALLBACKS =====
  onNodesChange: (changes) => {
    set((state) => {
      const nodes = applyNodeChanges(changes, state.nodes);
      return { nodes: recomputeEnabled(nodes, state.edges) };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => {
      const edges = applyEdgeChanges(changes, state.edges);
      return { edges, nodes: recomputeEnabled(state.nodes, edges) };
    });
  },

  onConnect: (connection) => {
    const { nodes, edges } = get();
    const source = nodes.find((n) => n.id === connection.source);
    const target = nodes.find((n) => n.id === connection.target);

    if (!source || !target) return;
    if (source.type === target.type) return;

    const exists = edges.some(
      (e) => e.source === connection.source && e.target === connection.target
    );
    if (exists) return;

    const newEdge = {
      id: `e-${nanoid(8)}`,
      source: connection.source,
      target: connection.target,
      type: 'arc',
      data: { weight: 1, type: EDGE_TYPES.ARC },
      markerEnd: { type: 'arrowclosed', color: '#1f2937', width: 18, height: 18 },
    };

    const nextEdges = addEdge(newEdge, edges);
    set({
      edges: nextEdges,
      nodes: recomputeEnabled(nodes, nextEdges),
      arcSource: null,
    });
  },

  // ===== ADD PLACE =====
  addPlace: (position) => {
    const { nodes } = get();
    const label = getNextName(nodes, NODE_TYPES.PLACE);
    const newNode = {
      id: `place-${nanoid(8)}`,
      type: NODE_TYPES.PLACE,
      position,
      data: { label, tokens: 0, capacity: Infinity },
    };
    const nextNodes = [...nodes, newNode];
    set({ nodes: nextNodes });
    return newNode;
  },

  // ===== ADD TRANSITION =====
  addTransition: (position) => {
    const { nodes, edges } = get();
    const label = getNextName(nodes, NODE_TYPES.TRANSITION);
    const newNode = {
      id: `trans-${nanoid(8)}`,
      type: NODE_TYPES.TRANSITION,
      position,
      data: { label, enabled: false },
    };
    const nextNodes = [...nodes, newNode];
    set({ nodes: recomputeEnabled(nextNodes, edges) });
    return newNode;
  },

  // ===== ADD ARC =====
  addArc: (sourceId, targetId, type = EDGE_TYPES.ARC) => {
    const { nodes, edges } = get();
    const source = nodes.find((n) => n.id === sourceId);
    const target = nodes.find((n) => n.id === targetId);

    if (!source || !target) return false;
    if (source.type === target.type) return false;

    const exists = edges.some(
      (e) => e.source === sourceId && e.target === targetId
    );
    if (exists) return false;

    if (type === EDGE_TYPES.INHIBITOR) {
      if (source.type !== NODE_TYPES.PLACE || target.type !== NODE_TYPES.TRANSITION) {
        return false;
      }
    }

    const newEdge = {
      id: `e-${nanoid(8)}`,
      source: sourceId,
      target: targetId,
      type: type === EDGE_TYPES.INHIBITOR ? 'inhibitor' : 'arc',
      data: { weight: 1, type },
      markerEnd:
        type === EDGE_TYPES.INHIBITOR
          ? undefined
          : { type: 'arrowclosed', color: '#1f2937', width: 18, height: 18 },
    };

    const nextEdges = [...edges, newEdge];
    set({
      edges: nextEdges,
      nodes: recomputeEnabled(nodes, nextEdges),
      arcSource: null,
    });
    return true;
  },

  // ===== UPDATE NODE DATA =====
  updateNodeData: (nodeId, newData) => {
    set((state) => {
      const nodes = state.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const data = { ...n.data, ...newData };

        // Garantit l'unicité du nom quand on renomme un nœud
        if (newData.label !== undefined && typeof newData.label === 'string') {
          data.label = uniqueLabel(state.nodes, n.type, newData.label, nodeId);
        }

        // Clamp des jetons pour les places
        if (n.type === NODE_TYPES.PLACE) {
          if (data.tokens !== undefined) {
            data.tokens = clampTokens(data.tokens, data.capacity ?? Infinity);
          }
          if (
            newData.capacity !== undefined &&
            data.capacity !== Infinity &&
            data.tokens > data.capacity
          ) {
            data.tokens = data.capacity;
          }
        }
        return { ...n, data };
      });
      return { nodes: recomputeEnabled(nodes, state.edges) };
    });
  },

  // ===== UPDATE EDGE DATA =====
  updateEdgeData: (edgeId, newData) => {
    set((state) => {
      const edges = state.edges.map((e) => {
        if (e.id !== edgeId) return e;
        const data = { ...e.data, ...newData };
        if (data.weight !== undefined) {
          data.weight = Math.max(1, Math.floor(data.weight) || 1);
        }
        return { ...e, data };
      });
      return { edges, nodes: recomputeEnabled(state.nodes, edges) };
    });
  },

  // ===== SET TOKENS =====
  setTokens: (placeId, count) => {
    const node = get().nodes.find((n) => n.id === placeId);
    if (!node || node.type !== NODE_TYPES.PLACE) return;
    get().updateNodeData(placeId, { tokens: clampTokens(count, node.data.capacity) });
  },

  // ===== DELETE SELECTED =====
  deleteSelected: () => {
    set((state) => {
      const { nodes, edges } = state;
      const selectedNodeIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
      const nextNodes = nodes.filter((n) => !n.selected);
      const nextEdges = edges.filter(
        (e) => !e.selected && !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
      );
      return {
        nodes: recomputeEnabled(nextNodes, nextEdges),
        edges: nextEdges,
        selectedElement: null,
      };
    });
  },

  // ===== CLEAR ALL =====
  clearAll: () => {
    set({
      nodes: [],
      edges: [],
      selectedElement: null,
      arcSource: null,
      toolMode: TOOL_MODES.SELECT,
    });
  },

  // ===== GET PLACES & TRANSITIONS =====
  getPlaces: () => get().nodes.filter((n) => n.type === NODE_TYPES.PLACE),
  getTransitions: () => get().nodes.filter((n) => n.type === NODE_TYPES.TRANSITION),

  // ===== GET INPUT/OUTPUT PLACES =====
  getInputPlaces: (transitionId) => {
    const { edges, nodes } = get();
    return edges
      .filter((e) => e.target === transitionId)
      .map((e) => ({ place: nodes.find((n) => n.id === e.source), edge: e }))
      .filter((x) => x.place);
  },

  getOutputPlaces: (transitionId) => {
    const { edges, nodes } = get();
    return edges
      .filter((e) => e.source === transitionId)
      .map((e) => ({ place: nodes.find((n) => n.id === e.target), edge: e }))
      .filter((x) => x.place);
  },

  // ===== IS TRANSITION ENABLED =====
  isTransitionEnabled: (transitionId) => {
    const { nodes, edges } = get();
    const t = nodes.find((n) => n.id === transitionId);
    if (!t) return false;
    if (t.data.enabled !== undefined) return t.data.enabled;
    // Fallback calculé à la volée
    const incoming = edges.filter((e) => e.target === transitionId);
    if (incoming.length === 0) return true;
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    return incoming.every((edge) => {
      const place = nodeById.get(edge.source);
      if (!place) return true;
      if (edge.data?.type === EDGE_TYPES.INHIBITOR) return place.data.tokens === 0;
      return place.data.tokens >= (edge.data?.weight || 1);
    });
  },

  // ===== UPDATE ENABLED STATUS (sync, conservée pour compatibilité) =====
  updateAllTransitionsEnabled: () => {
    set((state) => ({ nodes: recomputeEnabled(state.nodes, state.edges) }));
  },

  // ===== FIRE TRANSITION =====
  fireTransition: (transitionId) => {
    const state = get();
    const { nodes, edges } = state;

    // Calcul synchrone de la franchissabilité
    const incoming = edges.filter((e) => e.target === transitionId);
    const outgoing = edges.filter((e) => e.source === transitionId);
    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    const enabled =
      incoming.length === 0 ||
      incoming.every((edge) => {
        const place = nodeById.get(edge.source);
        if (!place) return true;
        if (edge.data?.type === EDGE_TYPES.INHIBITOR) return place.data.tokens === 0;
        return place.data.tokens >= (edge.data?.weight || 1);
      });

    if (!enabled) return false;

    let newNodes = nodes.map((n) => ({ ...n, data: { ...n.data } }));
    const idxById = new Map(newNodes.map((n, i) => [n.id, i]));

    incoming.forEach((edge) => {
      if (edge.data?.type === EDGE_TYPES.INHIBITOR) return;
      const idx = idxById.get(edge.source);
      if (idx === undefined) return;
      const weight = edge.data?.weight || 1;
      newNodes[idx].data.tokens = Math.max(0, newNodes[idx].data.tokens - weight);
    });

    outgoing.forEach((edge) => {
      const idx = idxById.get(edge.target);
      if (idx === undefined) return;
      const place = newNodes[idx];
      const weight = edge.data?.weight || 1;
      const capacity = place.data.capacity;
      const next = place.data.tokens + weight;
      place.data.tokens = capacity !== Infinity ? Math.min(next, capacity) : next;
    });

    set({ nodes: recomputeEnabled(newNodes, edges) });
    return true;
  },

  // ===== GET CURRENT MARKING =====
  getCurrentMarking: () => {
    const places = get().getPlaces();
    return places.map((p) => p.data.tokens);
  },

  getMarkingObject: () => {
    const marking = {};
    get()
      .getPlaces()
      .forEach((p) => {
        marking[p.id] = p.data.tokens;
      });
    return marking;
  },

  // ===== SET MARKING =====
  setMarking: (marking) => {
    set((state) => {
      const nodes = state.nodes.map((n) => {
        if (n.type !== NODE_TYPES.PLACE) return n;
        if (marking[n.id] === undefined) return n;
        return {
          ...n,
          data: {
            ...n.data,
            tokens: clampTokens(marking[n.id], n.data.capacity),
          },
        };
      });
      return { nodes: recomputeEnabled(nodes, state.edges) };
    });
  },

  // ===== EXPORT / IMPORT =====
  exportNet: () => {
    const { nodes, edges } = get();
    return JSON.stringify({ nodes, edges }, null, 2);
  },

  importNet: (json) => {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        return false;
      }

      // Nettoyage / normalisation
      let nodes = data.nodes.map((n) => {
        if (n.type === NODE_TYPES.PLACE) {
          const capacity =
            n.data?.capacity === null ||
            n.data?.capacity === undefined ||
            n.data.capacity === 'Infinity'
              ? Infinity
              : n.data.capacity;
          const tokens = clampTokens(n.data?.tokens ?? 0, capacity);
          return { ...n, data: { ...n.data, capacity, tokens } };
        }
        if (n.type === NODE_TYPES.TRANSITION) {
          return { ...n, data: { enabled: false, ...n.data } };
        }
        return n;
      });

      // Garantit l'unicité des libellés au cas où le fichier importé
      // contiendrait des doublons (les calculs matriciels utilisent les labels).
      nodes = nodes.map((n, idx) => {
        const previous = nodes.slice(0, idx);
        const unique = uniqueLabel(previous, n.type, n.data?.label ?? '', null);
        if (unique === n.data?.label) return n;
        return { ...n, data: { ...n.data, label: unique } };
      });

      const edges = data.edges.map((e) => ({
        ...e,
        data: {
          type: e.data?.type === EDGE_TYPES.INHIBITOR ? EDGE_TYPES.INHIBITOR : EDGE_TYPES.ARC,
          weight: Math.max(1, Math.floor(e.data?.weight) || 1),
        },
      }));

      set({
        nodes: recomputeEnabled(nodes, edges),
        edges,
        selectedElement: null,
        arcSource: null,
        toolMode: TOOL_MODES.SELECT,
      });
      return true;
    } catch {
      return false;
    }
  },
}));

export default usePetriStore;
