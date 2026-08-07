import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { TOOL_MODES, NODE_TYPES, EDGE_TYPES } from '../constants/defaults';

// Helper pour générer les noms
const getNextName = (nodes, type) => {
  const prefix = type === NODE_TYPES.PLACE ? 'P' : 'T';
  const existing = nodes
    .filter((n) => n.type === type)
    .map((n) => {
      const match = n.data.label.match(new RegExp(`^${prefix}(\\d+)$`));
      return match ? parseInt(match[1]) : 0;
    });
  const max = existing.length > 0 ? Math.max(...existing) : 0;
  return `${prefix}${max + 1}`;
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
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
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

    set({ edges: addEdge(newEdge, edges) });
  },

  // ===== ADD PLACE =====
  addPlace: (position) => {
    const { nodes } = get();
    const label = getNextName(nodes, NODE_TYPES.PLACE);
    const newNode = {
      id: `place-${nanoid(8)}`,
      type: NODE_TYPES.PLACE,
      position,
      data: {
        label,
        tokens: 0,
        capacity: Infinity,
      },
    };
    set({ nodes: [...nodes, newNode] });
    return newNode;
  },

  // ===== ADD TRANSITION =====
  addTransition: (position) => {
    const { nodes } = get();
    const label = getNextName(nodes, NODE_TYPES.TRANSITION);
    const newNode = {
      id: `trans-${nanoid(8)}`,
      type: NODE_TYPES.TRANSITION,
      position,
      data: {
        label,
        enabled: false,
      },
    };
    set({ nodes: [...nodes, newNode] });
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
      markerEnd: type === EDGE_TYPES.INHIBITOR
        ? undefined
        : { type: 'arrowclosed', color: '#1f2937', width: 18, height: 18 },
    };

    set({ edges: [...edges, newEdge] });
    return true;
  },

  // ===== UPDATE NODE DATA =====
  updateNodeData: (nodeId, newData) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n
      ),
    });
  },

  // ===== UPDATE EDGE DATA =====
  updateEdgeData: (edgeId, newData) => {
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...newData } } : e
      ),
    });
  },

  // ===== SET TOKENS =====
  setTokens: (placeId, count) => {
    const node = get().nodes.find((n) => n.id === placeId);
    if (!node || node.type !== NODE_TYPES.PLACE) return;
    
    const capacity = node.data.capacity;
    const tokens = Math.max(0, capacity !== Infinity ? Math.min(count, capacity) : count);
    
    get().updateNodeData(placeId, { tokens });
  },

  // ===== DELETE SELECTED =====
  deleteSelected: () => {
    const { nodes, edges } = get();
    const selectedNodes = nodes.filter((n) => n.selected);
    const selectedEdges = edges.filter((e) => e.selected);
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

    set({
      nodes: nodes.filter((n) => !n.selected),
      edges: edges.filter(
        (e) =>
          !e.selected &&
          !selectedNodeIds.has(e.source) &&
          !selectedNodeIds.has(e.target)
      ),
      selectedElement: null,
    });
  },

  // ===== CLEAR ALL =====
  clearAll: () => {
    set({
      nodes: [],
      edges: [],
      selectedElement: null,
      arcSource: null,
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
      .map((e) => ({
        place: nodes.find((n) => n.id === e.source),
        edge: e,
      }))
      .filter((x) => x.place);
  },

  getOutputPlaces: (transitionId) => {
    const { edges, nodes } = get();
    return edges
      .filter((e) => e.source === transitionId)
      .map((e) => ({
        place: nodes.find((n) => n.id === e.target),
        edge: e,
      }))
      .filter((x) => x.place);
  },

  // ===== IS TRANSITION ENABLED =====
  isTransitionEnabled: (transitionId) => {
    const { getInputPlaces } = get();
    const inputs = getInputPlaces(transitionId);

    // Transition source (pas d'entrées) → toujours franchissable
    if (inputs.length === 0) return true;

    return inputs.every(({ place, edge }) => {
      if (edge.data.type === EDGE_TYPES.INHIBITOR) {
        // Arc inhibiteur: la place doit être vide (0 jetons)
        return place.data.tokens === 0;
      }
      // Arc normal: assez de jetons
      return place.data.tokens >= (edge.data.weight || 1);
    });
  },

  // ===== UPDATE ENABLED STATUS =====
  updateAllTransitionsEnabled: () => {
    const { nodes, isTransitionEnabled } = get();
    const updatedNodes = nodes.map((n) => {
      if (n.type === NODE_TYPES.TRANSITION) {
        return {
          ...n,
          data: { ...n.data, enabled: isTransitionEnabled(n.id) },
        };
      }
      return n;
    });
    set({ nodes: updatedNodes });
  },

  // ===== FIRE TRANSITION =====
  fireTransition: (transitionId) => {
    const state = get();
    if (!state.isTransitionEnabled(transitionId)) return false;

    const inputs = state.getInputPlaces(transitionId);
    const outputs = state.getOutputPlaces(transitionId);

    let newNodes = [...state.nodes];

    // Consommer les jetons des places d'entrée (sauf arcs inhibiteurs)
    inputs.forEach(({ place, edge }) => {
      if (edge.data.type === EDGE_TYPES.INHIBITOR) return;
      const weight = edge.data.weight || 1;
      const idx = newNodes.findIndex((n) => n.id === place.id);
      if (idx !== -1) {
        newNodes[idx] = {
          ...newNodes[idx],
          data: {
            ...newNodes[idx].data,
            tokens: newNodes[idx].data.tokens - weight,
          },
        };
      }
    });

    // Produire les jetons dans les places de sortie
    outputs.forEach(({ place, edge }) => {
      const weight = edge.data.weight || 1;
      const idx = newNodes.findIndex((n) => n.id === place.id);
      if (idx !== -1) {
        const currentTokens = newNodes[idx].data.tokens;
        const capacity = newNodes[idx].data.capacity;
        const newTokens = capacity !== Infinity
          ? Math.min(currentTokens + weight, capacity)
          : currentTokens + weight;
        newNodes[idx] = {
          ...newNodes[idx],
          data: { ...newNodes[idx].data, tokens: newTokens },
        };
      }
    });

    set({ nodes: newNodes });
    
    // Mettre à jour les transitions franchissables
    setTimeout(() => get().updateAllTransitionsEnabled(), 0);

    return true;
  },

  // ===== GET CURRENT MARKING =====
  getCurrentMarking: () => {
    const places = get().getPlaces();
    return places.map((p) => p.data.tokens);
  },

  getMarkingObject: () => {
    const places = get().getPlaces();
    const marking = {};
    places.forEach((p) => {
      marking[p.id] = p.data.tokens;
    });
    return marking;
  },

  // ===== SET MARKING =====
  setMarking: (marking) => {
    const { nodes } = get();
    const newNodes = nodes.map((n) => {
      if (n.type === NODE_TYPES.PLACE && marking[n.id] !== undefined) {
        return { ...n, data: { ...n.data, tokens: marking[n.id] } };
      }
      return n;
    });
    set({ nodes: newNodes });
    setTimeout(() => get().updateAllTransitionsEnabled(), 0);
  },

  // ===== EXPORT / IMPORT =====
  exportNet: () => {
    const { nodes, edges } = get();
    return JSON.stringify({ nodes, edges }, null, 2);
  },
importNet: (json) => {
  try {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    if (data.nodes && data.edges) {
      // Convertir null → Infinity pour les capacités
      const cleanedNodes = data.nodes.map((n) => {
        if (n.type === 'place' && (n.data.capacity === null || n.data.capacity === undefined)) {
          return { ...n, data: { ...n.data, capacity: Infinity } };
        }
        return n;
      });
      set({ nodes: cleanedNodes, edges: data.edges, selectedElement: null });
      setTimeout(() => get().updateAllTransitionsEnabled(), 0);
      return true;
    }
    return false;
  } catch {
    return false;
  }
},
}));

export default usePetriStore;