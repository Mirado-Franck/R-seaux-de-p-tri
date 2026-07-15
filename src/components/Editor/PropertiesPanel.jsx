import { useState, useEffect } from 'react';
import usePetriStore from '../../stores/usePetriStore';
import { NODE_TYPES, EDGE_TYPES } from '../../constants/defaults';

const PropertiesPanel = () => {
  const nodes = usePetriStore((s) => s.nodes);
  const edges = usePetriStore((s) => s.edges);
  const updateNodeData = usePetriStore((s) => s.updateNodeData);
  const updateEdgeData = usePetriStore((s) => s.updateEdgeData);

  const selectedNodes = nodes.filter((n) => n.selected);
  const selectedEdges = edges.filter((e) => e.selected);
  const selected = selectedNodes[0] || null;
  const selectedEdge = selectedEdges[0] || null;

  if (selected && selected.type === NODE_TYPES.PLACE) {
    return (
      <div className="p-4 space-y-4">
        <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
          Place: {selected.data.label}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
            <input
              type="text"
              value={selected.data.label}
              onChange={(e) => updateNodeData(selected.id, { label: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Jetons (M₀)</label>
            <input
              type="number"
              min="0"
              value={selected.data.tokens}
              onChange={(e) =>
                updateNodeData(selected.id, { tokens: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Capacité (K)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={selected.data.capacity === Infinity ? '' : selected.data.capacity}
                placeholder="∞"
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  updateNodeData(selected.id, {
                    capacity: isNaN(val) || val <= 0 ? Infinity : val,
                  });
                }}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {selected.data.capacity !== Infinity && (
                <button
                  onClick={() => updateNodeData(selected.id, { capacity: Infinity })}
                  className="px-2 py-1.5 text-xs bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  ∞
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selected && selected.type === NODE_TYPES.TRANSITION) {
    return (
      <div className="p-4 space-y-4">
        <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
          Transition: {selected.data.label}
        </h3>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
          <input
            type="text"
            value={selected.data.label}
            onChange={(e) => updateNodeData(selected.id, { label: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mt-3 p-3 rounded-lg bg-gray-50">
          <span className="text-xs font-medium text-gray-500">État: </span>
          <span className={`text-sm font-bold ${selected.data.enabled ? 'text-amber-600' : 'text-gray-400'}`}>
            {selected.data.enabled ? '🟢 Franchissable' : '🔴 Non franchissable'}
          </span>
        </div>
      </div>
    );
  }

  if (selectedEdge) {
    return (
      <div className="p-4 space-y-4">
        <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
          Arc {selectedEdge.data?.type === EDGE_TYPES.INHIBITOR ? 'Inhibiteur' : ''}
        </h3>
        {selectedEdge.data?.type !== EDGE_TYPES.INHIBITOR && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Poids</label>
            <input
              type="number"
              min="1"
              value={selectedEdge.data?.weight || 1}
              onChange={(e) =>
                updateEdgeData(selectedEdge.id, {
                  weight: Math.max(1, parseInt(e.target.value) || 1),
                })
              }
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
        <div className="text-xs text-gray-500">
          <p>Source: {nodes.find((n) => n.id === selectedEdge.source)?.data.label}</p>
          <p>Cible: {nodes.find((n) => n.id === selectedEdge.target)?.data.label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 text-center text-gray-400 text-sm">
      <p>Sélectionnez un élément pour voir ses propriétés</p>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left text-xs text-gray-500 space-y-1">
        <p><strong>Places:</strong> {nodes.filter((n) => n.type === NODE_TYPES.PLACE).length}</p>
        <p><strong>Transitions:</strong> {nodes.filter((n) => n.type === NODE_TYPES.TRANSITION).length}</p>
        <p><strong>Arcs:</strong> {edges.length}</p>
      </div>
    </div>
  );
};

export default PropertiesPanel;