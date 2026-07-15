import { useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import PlaceNode from './PlaceNode';
import TransitionNode from './TransitionNode';
import ArcEdge from './ArcEdge';
import InhibitorArcEdge from './InhibitorArcEdge';
import EditorToolbar from './EditorToolbar';

import usePetriStore from '../../stores/usePetriStore';
import useUIStore from '../../stores/useUIStore';
import { TOOL_MODES, NODE_TYPES, EDGE_TYPES } from '../../constants/defaults';

const PetriNetEditor = () => {
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);

  const nodes = usePetriStore((s) => s.nodes);
  const edges = usePetriStore((s) => s.edges);
  const toolMode = usePetriStore((s) => s.toolMode);
  const onNodesChange = usePetriStore((s) => s.onNodesChange);
  const onEdgesChange = usePetriStore((s) => s.onEdgesChange);
  const onConnect = usePetriStore((s) => s.onConnect);
  const addPlace = usePetriStore((s) => s.addPlace);
  const addTransition = usePetriStore((s) => s.addTransition);
  const addArc = usePetriStore((s) => s.addArc);
  const setTokens = usePetriStore((s) => s.setTokens);
  const updateAllTransitionsEnabled = usePetriStore((s) => s.updateAllTransitionsEnabled);
  const arcSource = usePetriStore((s) => s.arcSource);
  const setArcSource = usePetriStore((s) => s.setArcSource);
  const deleteSelected = usePetriStore((s) => s.deleteSelected);

  const showMinimap = useUIStore((s) => s.showMinimap);

  const nodeTypes = useMemo(() => ({
    [NODE_TYPES.PLACE]: PlaceNode,
    [NODE_TYPES.TRANSITION]: TransitionNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    arc: ArcEdge,
    inhibitor: InhibitorArcEdge,
  }), []);

  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
  }, []);

  const screenToFlowPosition = useCallback((event) => {
    if (!reactFlowInstance.current) return { x: 0, y: 0 };
    return reactFlowInstance.current.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  const onPaneClick = useCallback((event) => {
    const position = screenToFlowPosition(event);

    switch (toolMode) {
      case TOOL_MODES.ADD_PLACE:
        addPlace(position);
        setTimeout(() => updateAllTransitionsEnabled(), 0);
        break;
      case TOOL_MODES.ADD_TRANSITION:
        addTransition(position);
        setTimeout(() => updateAllTransitionsEnabled(), 0);
        break;
      default:
        setArcSource(null);
        break;
    }
  }, [toolMode, screenToFlowPosition, addPlace, addTransition, setArcSource, updateAllTransitionsEnabled]);

  const onNodeClick = useCallback((_event, node) => {
    switch (toolMode) {
      case TOOL_MODES.ADD_TOKEN:
        if (node.type === NODE_TYPES.PLACE) {
          setTokens(node.id, node.data.tokens + 1);
          setTimeout(() => updateAllTransitionsEnabled(), 0);
        }
        break;
      case TOOL_MODES.REMOVE_TOKEN:
        if (node.type === NODE_TYPES.PLACE) {
          setTokens(node.id, node.data.tokens - 1);
          setTimeout(() => updateAllTransitionsEnabled(), 0);
        }
        break;
      case TOOL_MODES.ADD_ARC:
      case TOOL_MODES.ADD_INHIBITOR:
        if (arcSource === null) {
          setArcSource(node.id);
        } else if (arcSource !== node.id) {
          const type = toolMode === TOOL_MODES.ADD_INHIBITOR ? EDGE_TYPES.INHIBITOR : EDGE_TYPES.ARC;
          addArc(arcSource, node.id, type);
          setArcSource(null);
          setTimeout(() => updateAllTransitionsEnabled(), 0);
        } else {
          setArcSource(null);
        }
        break;
      default:
        break;
    }
  }, [toolMode, arcSource, setArcSource, addArc, setTokens, updateAllTransitionsEnabled]);

  const onKeyDown = useCallback((event) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      deleteSelected();
    }
  }, [deleteSelected]);

  return (
    <div className="editor-container" onKeyDown={onKeyDown} tabIndex={0}>
      <EditorToolbar />
      <div ref={reactFlowWrapper} style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          onPaneClick={onPaneClick}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'arc',
            markerEnd: { type: 'arrowclosed', color: '#374151' },
          }}
          deleteKeyCode={['Delete', 'Backspace']}
        >
          <Controls />
          {showMinimap && (
            <MiniMap
              nodeColor={(node) =>
                node.type === NODE_TYPES.PLACE ? '#3b82f6' : '#10b981'
              }
              nodeStrokeWidth={3}
              zoomable
              pannable
            />
          )}
          <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
        </ReactFlow>
      </div>

      {/* Indicateur du mode arc */}
      {(toolMode === TOOL_MODES.ADD_ARC || toolMode === TOOL_MODES.ADD_INHIBITOR) && arcSource && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          Source sélectionnée — Cliquez sur la cible pour créer l'arc
        </div>
      )}
    </div>
  );
};

export default PetriNetEditor;