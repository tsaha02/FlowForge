// ============================================
// FlowForge — Workflow Store (Zustand)
// ============================================
// Manages the React Flow canvas state: nodes, edges, selected node,
// and workflow metadata. This is the "brain" of the editor.
//
// WHAT IS THIS?
// React Flow needs arrays of nodes and edges to render the canvas.
// This store holds those arrays and provides actions to modify them.
// Any component can read or update the canvas state through this store.

import { create } from 'zustand';
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import { NODE_TYPES } from '@/types/nodes';

interface WorkflowMeta {
  id: string | null;
  name: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  triggerType: 'MANUAL' | 'CRON' | 'WEBHOOK';
  cronExpression: string;
}

interface WorkflowState {
  // Canvas state
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Workflow metadata
  meta: WorkflowMeta;

  // Dirty flag — has the workflow been modified since last save?
  isDirty: boolean;

  // Undo/Redo history
  history: { nodes: Node[]; edges: Edge[] }[];
  historyIndex: number;

  // Actions — Canvas
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  // Actions — Workflow metadata
  setMeta: (meta: Partial<WorkflowMeta>) => void;
  validateWorkflow: () => { isValid: true } | { isValid: false; errors: string[] };

  // Actions — History (undo/redo)
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Actions — Load/Reset
  loadWorkflow: (data: {
    id: string;
    name: string;
    description: string;
    status: string;
    triggerType: string;
    cronExpression: string;
    nodes: Node[];
    edges: Edge[];
  }) => void;
  resetWorkflow: () => void;
}

const MAX_HISTORY = 50;

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDirty: false,

  meta: {
    id: null,
    name: 'Untitled Workflow',
    description: '',
    status: 'DRAFT',
    triggerType: 'MANUAL',
    cronExpression: '',
  },

  history: [],
  historyIndex: -1,

  // ---- Canvas Actions ----

  // Called by React Flow when nodes are moved, selected, deleted, etc.
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      isDirty: true,
    });
  },

  // Called by React Flow when edges change
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    });
  },

  // Called when a user draws a connection between two nodes
  onConnect: (connection) => {
    const newEdge: Edge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3B82F6', strokeWidth: 2 },
    } as Edge;
    set({
      edges: addEdge(newEdge, get().edges) as Edge[],
      isDirty: true,
    });
    get().pushHistory();
  },

  // Add a new node to the canvas (from drag-and-drop)
  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
      isDirty: true,
    });
    get().pushHistory();
  },

  // Update a node's data (from the config panel)
  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node,
      ),
      isDirty: true,
    });
  },

  // Delete a node and its connected edges
  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
      isDirty: true,
    });
    get().pushHistory();
  },

  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  // ---- Metadata Actions ----
  setMeta: (meta) => set({
    meta: { ...get().meta, ...meta },
    isDirty: true,
  }),

  // ---- Validation ----
  validateWorkflow: () => {
    const { nodes } = get();
    const errors: string[] = [];

    if (nodes.length === 0) {
      errors.push('Workflow must have at least one node.');
      return { isValid: false, errors };
    }

    nodes.forEach((node) => {
      const nodeData = node.data as Record<string, unknown>;
      const nodeTypeString = nodeData?.nodeType as string;
      const typeDef = NODE_TYPES[nodeTypeString];

      if (!typeDef) return;

      const config = (nodeData?.config as Record<string, unknown>) || {};
      const nodeLabel = (nodeData?.label as string) || typeDef.label;

      typeDef.fields.forEach((field) => {
        if (field.required) {
          const val = config[field.name];
          if (val === undefined || val === null || val === '') {
            errors.push(`"${nodeLabel}" node is missing required field: ${field.label}`);
          }
        }
      });
    });

    return errors.length === 0
      ? { isValid: true }
      : { isValid: false, errors };
  },

  // ---- History (Undo/Redo) ----
  pushHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    // Remove any "future" history (if we undid and then made changes)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });

    // Cap history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      set({
        nodes: JSON.parse(JSON.stringify(prev.nodes)),
        edges: JSON.parse(JSON.stringify(prev.edges)),
        historyIndex: historyIndex - 1,
        isDirty: true,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({
        nodes: JSON.parse(JSON.stringify(next.nodes)),
        edges: JSON.parse(JSON.stringify(next.edges)),
        historyIndex: historyIndex + 1,
        isDirty: true,
      });
    }
  },

  // ---- Load/Reset ----
  loadWorkflow: (data) => {
    set({
      nodes: data.nodes || [],
      edges: data.edges || [],
      selectedNodeId: null,
      isDirty: false,
      meta: {
        id: data.id,
        name: data.name || 'Untitled Workflow',
        description: data.description || '',
        status: (data.status as WorkflowMeta['status']) || 'DRAFT',
        triggerType: (data.triggerType as WorkflowMeta['triggerType']) || 'MANUAL',
        cronExpression: data.cronExpression || '',
      },
      history: [{ nodes: data.nodes || [], edges: data.edges || [] }],
      historyIndex: 0,
    });
  },

  resetWorkflow: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isDirty: false,
      meta: {
        id: null,
        name: 'Untitled Workflow',
        description: '',
        status: 'DRAFT',
        triggerType: 'MANUAL',
        cronExpression: '',
      },
      history: [],
      historyIndex: -1,
    });
  },
}));
