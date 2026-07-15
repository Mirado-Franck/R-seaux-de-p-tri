import { memo } from 'react';
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

const InhibitorArcEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: '#ef4444',
          strokeDasharray: '6,4',
        }}
      />
      {/* Cercle au bout (arc inhibiteur) */}
      <circle
        cx={targetX}
        cy={targetY}
        r={6}
        fill="white"
        stroke="#ef4444"
        strokeWidth={2}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fef2f2',
            padding: '1px 5px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '700',
            color: '#ef4444',
            border: '1px solid #fca5a5',
            pointerEvents: 'none',
          }}
        >
          ∅
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(InhibitorArcEdge);