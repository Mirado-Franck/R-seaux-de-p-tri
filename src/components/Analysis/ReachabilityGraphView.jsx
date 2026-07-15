import { useMemo, useState, useCallback } from 'react';
import ReactFlow, { Controls, Background, BackgroundVariant } from 'reactflow';
import dagre from '@dagrejs/dagre';
import usePetriStore from '../../stores/usePetriStore';
import { generateReachabilityGraph } from '../../utils/reachabilityGraph';

const dagreLayout = (states, transitions) => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 80 });

  states.forEach((s) => {
    g.setNode(s.id, { width: 120, height: 40 });
  });

  transitions.forEach((t, i) => {
    g.setEdge(t.from, t.to);
  });

  dagre.layout(g);

  return states.map((s) => {
    const pos = g.node(s.id);
    return {
      id: s.id,
      type: 'default',
      position: { x: pos.x - 60, y: pos.y - 20 },
      data: { label: s.label },
      style: {
        background: s.id === 'm0' ? '#dbeafe' : '#f0fdf4',
        border: s.id === 'm0' ? '2px solid #3b82f6' : '1px solid #86efac',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '600',
        padding: '8px 12px',
      },
    };
  });
};

const ReachabilityGraphView = () => {
  const nodes = usePetriStore((s) => s.nodes);
  const edges = usePetriStore((s) => s.edges);
  const [generated, setGenerated] = useState(false);
  const [rgData, setRgData] = useState(null);

  const handleGenerate = useCallback(() => {
    const rg = generateReachabilityGraph(nodes, edges);
    setRgData(rg);
    setGenerated(true);
  }, [nodes, edges]);

  const { flowNodes, flowEdges } = useMemo(() => {
    if (!rgData) return { flowNodes: [], flowEdges: [] };

    const flowNodes = dagreLayout(rgData.states, rgData.transitions);
    const flowEdges = rgData.transitions.map((t, i) => ({
      id: `rg-e-${i}`,
      source: t.from,
      target: t.to,
      label: t.label,
      type: 'default',
      markerEnd: { type: 'arrowclosed', color: '#6b7280' },
      style: { stroke: '#6b7280' },
      labelStyle: { fontSize: '11px', fontWeight: '600', fill: '#374151' },
      labelBgStyle: { fill: '#f9fafb', fillOpacity: 0.9 },
    }));

    return { flowNodes, flowEdges };
  }, [rgData]);

  return (
    <div className="p-4">
      <h3 className="text-base font-bold text-gray-800 mb-3">Graphe de Marquage</h3>

      <button
        onClick={handleGenerate}
        className="w-full py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition mb-3"
      >
        Générer le graphe de marquage
      </button>

      {rgData && (
        <>
          <div className="text-xs text-gray-500 mb-2 space-y-1">
            <p>États: {rgData.states.length}</p>
            <p>Transitions: {rgData.transitions.length}</p>
            {rgData.truncated && (
              <p className="text-amber-600 font-medium">
                ⚠ Graphe tronqué (limite d'états atteinte)
              </p>
            )}
          </div>

          <div style={{ height: '400px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag
              zoomOnScroll
            >
              <Controls showInteractive={false} />
              <Background variant={BackgroundVariant.Dots} />
            </ReactFlow>
          </div>
        </>
      )}
    </div>
  );
};

export default ReachabilityGraphView;