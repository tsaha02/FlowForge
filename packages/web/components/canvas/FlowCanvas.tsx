// ============================================
// FlowForge — Flow Canvas
// ============================================
// The main React Flow canvas where users build their workflows.
// This is the centerpiece of the entire application.
//
// HOW IT WORKS:
// 1. React Flow renders nodes and edges on an interactive canvas
// 2. Users can drag nodes from the palette and drop them here
// 3. Connecting nodes creates edges (the lines between nodes)
// 4. Clicking a node opens the config panel on the right
// 5. The canvas state is stored in the Zustand workflow store

'use client';

import { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowInstance,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '@/stores/workflowStore';
import { NODE_TYPES } from '@/types/nodes';
import WorkflowNode from '@/components/canvas/WorkflowNode';

import { NodeStatusUpdate } from '@/hooks/useExecution';

// Register our custom node type with React Flow
const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

interface FlowCanvasProps {
  nodeStatuses?: Map<string, NodeStatusUpdate>;
}

export default function FlowCanvas({ nodeStatuses }: FlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
  } = useWorkflowStore();

  // Handle drag over (allows dropping)
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop — creates a new node at the drop position
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('application/flowforge-node');
      if (!nodeType || !NODE_TYPES[nodeType]) return;

      const typeDef = NODE_TYPES[nodeType];

      // Convert screen coordinates to canvas coordinates
      if (!reactFlowInstance.current || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      // Create a new node
      const newNode = {
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'workflowNode', // Our custom node type
        position,
        data: {
          nodeType: nodeType,
          label: typeDef.label,
          config: {},
        },
      };

      addNode(newNode);
    },
    [addNode],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  // Inject execution status into node data
  const nodesWithStatus = useMemo(() => {
    if (!nodeStatuses || nodeStatuses.size === 0) return nodes;
    
    return nodes.map((node) => {
      const statusUpdate = nodeStatuses.get(node.id);
      if (statusUpdate) {
        return {
          ...node,
          data: {
            ...node.data,
            executionStatus: statusUpdate.status,
            executionError: statusUpdate.error,
          },
        };
      }
      return node;
    });
  }, [nodes, nodeStatuses]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodesWithStatus}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onPaneClick={onPaneClick}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3B82F6', strokeWidth: 2 },
        }}
        connectionLineStyle={{ stroke: '#3B82F6', strokeWidth: 2 }}
        proOptions={{ hideAttribution: true }}
        className="bg-slate-50"
      >
        {/* Background grid pattern */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#CBD5E1"
        />

        {/* Zoom controls (bottom-left) */}
        <Controls
          className="!bg-white !border-slate-200 !rounded-xl !shadow-lg"
          showInteractive={false}
        />

        {/* Minimap (bottom-right) */}
        <MiniMap
          className="!bg-white !border-slate-200 !rounded-xl !shadow-lg"
          nodeColor={(node) => {
            const nodeData = node.data as Record<string, unknown>;
            const typeDef = NODE_TYPES[nodeData?.nodeType as string];
            return typeDef?.color || '#94A3B8';
          }}
          maskColor="rgba(15, 23, 42, 0.1)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
