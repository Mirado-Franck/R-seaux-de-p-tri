import { memo } from 'react';
import { useStore, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { getFloatingEdgeParams } from '../../utils/edgeGeometry';

const ArcEdge = ({ id, source, target, data, markerEnd, style }) => {
  // Récupérer les nœuds source et cible depuis le store React Flow
  const sourceNode = useStore((s) => s.nodeInternals.get(source));
  const targetNode = useStore((s) => s.nodeInternals.get(target));

  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty, sourcePos, targetPos } = getFloatingEdgeParams(sourceNode, targetNode);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    curvature: 0.25,
  });

  const weight = data?.weight || 1;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth: 1.5, stroke: '#1f2937' }}
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