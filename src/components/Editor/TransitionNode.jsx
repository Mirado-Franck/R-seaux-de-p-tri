import { memo, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import usePetriStore from '../../stores/usePetriStore';
import useSimulationStore from '../../stores/useSimulationStore';
import '../../styles/nodes.css';

const handleStyle = {
  background: 'transparent',
  border: 'none',
  width: 8,
  height: 8,
  opacity: 0,
};

const TransitionNode = ({ id, data, selected }) => {
  const fireTransition = usePetriStore((s) => s.fireTransition);
  const getMarkingObject = usePetriStore((s) => s.getMarkingObject);
  const recordFiring = useSimulationStore((s) => s.recordFiring);

  const handleDoubleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (!data.enabled) return;
      const success = fireTransition(id);
      if (success) {
        // fireTransition met le store à jour de façon synchrone :
        // getMarkingObject() reflète déjà le nouveau marquage.
        recordFiring(data.label, getMarkingObject());
      }
    },
    [id, data.enabled, data.label, fireTransition, getMarkingObject, recordFiring]
  );

  return (
    <div
      className={`transition-node ${data.enabled ? 'enabled' : ''} ${selected ? 'selected' : ''}`}
      onDoubleClick={handleDoubleClick}
      title={data.enabled ? 'Double-cliquez pour tirer cette transition' : 'Transition non franchissable'}
    >
      <Handle type="target" position={Position.Top} id="t" style={handleStyle} />
      <Handle type="source" position={Position.Top} id="s-t" style={handleStyle} />
      
      <Handle type="target" position={Position.Bottom} id="b" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="s-b" style={handleStyle} />
      
      <Handle type="target" position={Position.Left} id="l" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="s-l" style={handleStyle} />
      
      <Handle type="target" position={Position.Right} id="r" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="s-r" style={handleStyle} />

      <span className="transition-label">{data.label}</span>
    </div>
  );
};

export default memo(TransitionNode);