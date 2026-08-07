import { memo } from 'react';
import { useStore, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { getFloatingEdgeParams } from '../../utils/edgeGeometry';

const InhibitorArcEdge = ({ id, source, target, style }) => {
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

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth: 1.5,
          stroke: '#ef4444',
          strokeDasharray: '6,4',
        }}
      />
      {/* Cercle vide au bout de l'arc inhibiteur */}
      <circle
        cx={tx}
        cy={ty}
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