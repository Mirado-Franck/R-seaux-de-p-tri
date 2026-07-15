import { memo, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import usePetriStore from '../../stores/usePetriStore';
import useSimulationStore from '../../stores/useSimulationStore';
import '../../styles/nodes.css';

const TransitionNode = ({ id, data, selected }) => {
  const fireTransition = usePetriStore((s) => s.fireTransition);
  const getMarkingObject = usePetriStore((s) => s.getMarkingObject);
  const recordFiring = useSimulationStore((s) => s.recordFiring);

  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    if (data.enabled) {
      const success = fireTransition(id);
      if (success) {
        // Petit délai pour avoir le marquage mis à jour
        setTimeout(() => {
          recordFiring(data.label, getMarkingObject());
        }, 10);
      }
    }
  }, [id, data.enabled, data.label, fireTransition, getMarkingObject, recordFiring]);

  return (
    <div
      className={`transition-node ${data.enabled ? 'enabled' : ''} ${selected ? 'selected' : ''}`}
      onDoubleClick={handleDoubleClick}
      title={data.enabled ? 'Double-cliquez pour tirer cette transition' : 'Transition non franchissable'}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#10b981' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#10b981' }} />
      <Handle type="target" position={Position.Top} id="top" style={{ background: '#10b981' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#10b981' }} />

      <span className="transition-label">{data.label}</span>
    </div>
  );
};

export default memo(TransitionNode);