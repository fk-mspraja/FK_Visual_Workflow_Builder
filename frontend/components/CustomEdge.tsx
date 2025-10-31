'use client';

import { memo } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath } from '@xyflow/react';

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 24,
  });

  return (
    <>
      {/* Subtle glow effect for depth */}
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          stroke: '#93c5fd',
          strokeWidth: 6,
          opacity: 0.2,
        }}
      />
      {/* Main arrow line */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: '#64748b',
          strokeWidth: 2,
          strokeLinecap: 'round',
        }}
      />
    </>
  );
}

export default memo(CustomEdge);
