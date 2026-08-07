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

// Style commun pour tous les handles : invisibles mais fonctionnels
const handleStyle = {
  background: 'transparent',
  border: 'none',
  width: 8,
  height: 8,
  opacity: 0,
};

const PlaceNode = ({ data, selected }) => {
  return (
    <div className={`place-node ${selected ? 'selected' : ''}`}>
      {/* Handles invisibles sur les 4 côtés */}
      <Handle type="target" position={Position.Top} id="t" style={handleStyle} />
      <Handle type="source" position={Position.Top} id="s-t" style={handleStyle} />
      
      <Handle type="target" position={Position.Bottom} id="b" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="s-b" style={handleStyle} />
      
      <Handle type="target" position={Position.Left} id="l" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="s-l" style={handleStyle} />
      
      <Handle type="target" position={Position.Right} id="r" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="s-r" style={handleStyle} />

      {renderTokens(data.tokens)}

      {data.capacity !== Infinity && (
        <span className="capacity-badge">K={data.capacity}</span>
      )}

      <span className="place-label">{data.label}</span>
    </div>
  );
};

export default memo(PlaceNode);