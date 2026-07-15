import { memo } from 'react';
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

const ArcEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
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

  const weight = data?.weight || 1;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth: 2, stroke: '#374151' }}
      />
      {weight > 1 && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#1f2937',
              border: '1px solid #d1d5db',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {weight}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(ArcEdge);