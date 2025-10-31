'use client';

import { useCallback, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, ConnectionMode } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore, WorkflowNode as WorkflowNodeType } from '@/lib/store';
import { ACTION_BLOCKS } from '@/lib/actions';
import WorkflowNode from './WorkflowNode';
import CustomEdge from './CustomEdge';

const nodeTypes = {
  workflowNode: WorkflowNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export default function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
  } = useWorkflowStore();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const actionId = event.dataTransfer.getData('application/reactflow');
      if (!actionId) return;

      const action = ACTION_BLOCKS[actionId];
      if (!action) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = {
        x: event.clientX - bounds.left - 100,
        y: event.clientY - bounds.top - 50,
      };

      const newNode: WorkflowNodeType = {
        id: `${actionId}-${Date.now()}`,
        type: 'workflowNode',
        position,
        data: {
          label: action.name,
          activity: action.id,
          icon: action.icon,
          gradient: action.gradient,
          params: {},
          configured: false,
          action_count: action.action_count,
        },
      };

      addNode(newNode);
    },
    [addNode]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: WorkflowNodeType) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionLineType="smoothstep"
        fitView
        defaultEdgeOptions={{
          type: 'custom',
          animated: false,
          style: {
            stroke: '#64748b',
            strokeWidth: 2,
          },
          markerEnd: {
            type: 'arrowclosed',
            width: 16,
            height: 16,
            color: '#64748b',
          },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color="#f1f5f9"
          gap={20}
          size={1}
          style={{ backgroundColor: '#ffffff' }}
        />
        <Controls
          showInteractive={false}
          style={{
            button: {
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
            },
          }}
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as WorkflowNodeType['data'];
            return data.configured ? '#10b981' : '#f59e0b';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
          }}
        />
      </ReactFlow>
    </div>
  );
}
