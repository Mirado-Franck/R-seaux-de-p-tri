import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import '../../styles/nodes.css';

const renderTokens = (count) => {
  if (count === 0) return null;
  if (count <= 4) {
    return (
      <div className="tokens-container">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="token" />
        ))}
      </div>
    );
  }
  return <span className="token-count">{count}</span>;
};

const PlaceNode = ({ data, selected }) => {
  return (
    <div className={`place-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} style={{ background: '#3b82f6' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#3b82f6' }} />
      <Handle type="target" position={Position.Top} id="top" style={{ background: '#3b82f6' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#3b82f6' }} />

      {renderTokens(data.tokens)}

      {data.capacity !== Infinity && (
        <span className="capacity-badge">K={data.capacity}</span>
      )}

      <span className="place-label">{data.label}</span>
    </div>
  );
};

export default memo(PlaceNode);