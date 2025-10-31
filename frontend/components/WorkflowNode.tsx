'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { getActionIcon } from '@/lib/iconMap';

function WorkflowNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`relative bg-white rounded-2xl border border-gray-200 transition-all duration-200 min-w-[220px] ${
        selected ? 'ring-2 ring-blue-400 shadow-lg border-blue-300' : 'hover:shadow-md hover:border-gray-300'
      }`}
    >
      {/* Input Handle - Left Side */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-gray-400 !border-2 !border-white !-left-[6px] !rounded-full"
      />

      <div className="p-5">
        {/* Icon and Title */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${data.gradient} flex items-center justify-center text-white`}
          >
            {getActionIcon(data.activity, 'w-6 h-6')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm leading-tight">
              {data.label}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{data.activity}</div>
          </div>
        </div>

        {/* Status Badge */}
        {!data.configured && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              ⚠ Not configured
            </div>
          </div>
        )}
      </div>

      {/* Output Handle - Right Side */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-gray-400 !border-2 !border-white !-right-[6px] !rounded-full"
      />
    </div>
  );
}

export default memo(WorkflowNode);
