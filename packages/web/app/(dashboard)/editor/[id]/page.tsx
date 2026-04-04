// ============================================
// FlowForge — Editor Page (Phase 3 — With Execution!)
// ============================================
// Assembles: Toolbar + NodePalette + FlowCanvas + ConfigPanel
//            + WorkflowSettings + ExecutionLogPanel
// Now includes: Run button triggers execution, real-time log panel.

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { workflowApi, executionApi } from '@/lib/api';
import { useExecution } from '@/hooks/useExecution';
import FlowCanvas from '@/components/canvas/FlowCanvas';
import NodePalette from '@/components/canvas/NodePalette';
import EditorToolbar from '@/components/canvas/EditorToolbar';
import NodeConfigPanel from '@/components/panels/NodeConfigPanel';
import WorkflowSettingsPanel from '@/components/panels/WorkflowSettingsPanel';
import ExecutionLogPanel from '@/components/panels/ExecutionLogPanel';
import { Node, Edge } from '@xyflow/react';

export default function EditorPage() {
  const params = useParams();
  const workflowId = params.id as string;
  const { loadWorkflow, meta } = useWorkflowStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showExecutionLog, setShowExecutionLog] = useState(false);
  // isSubmitting: true from the moment Run is clicked until execution reaches a terminal state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time execution monitoring
  const execution = useExecution();

  // When execution reaches a terminal state, clear the submitting/loading flag
  useEffect(() => {
    const terminalStates = ['COMPLETED', 'FAILED', 'CANCELLED'];
    if (execution.executionStatus && terminalStates.includes(execution.executionStatus)) {
      setIsSubmitting(false);
    }
  }, [execution.executionStatus]);

  // Load the workflow from the API when the page loads
  useEffect(() => {
    async function fetchWorkflow() {
      try {
        const response = await workflowApi.get(workflowId);
        if (response.data) {
          const data = response.data;
          loadWorkflow({
            id: data.id,
            name: data.name,
            description: data.description || '',
            status: data.status,
            triggerType: data.triggerType,
            cronExpression: data.cronExpression || '',
            webhookPath: data.webhook?.path || null,
            webhookActive: data.webhook?.isActive || false,
            nodes: (data.nodesJson as Node[]) || [],
            edges: (data.edgesJson as Edge[]) || [],
          });
        }
      } catch (error) {
        console.error('Failed to load workflow:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (workflowId) {
      fetchWorkflow();
    }
  }, [workflowId, loadWorkflow]);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  // Handle "Run" button — executes the workflow
  const handleRun = useCallback(async () => {
    if (!meta.id) return;

    setIsSubmitting(true); // Show loading immediately on click, before any network call
    try {
      const response = await executionApi.execute(meta.id);
      if (response.data) {
        // Start monitoring the execution via Socket.IO
        execution.startMonitoring(response.data.executionId);
        setShowExecutionLog(true);
        // isSubmitting remains true until executionStatus turns terminal (see useEffect above)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to start workflow';
      console.error('Failed to execute workflow:', error);
      alert(`❌ ${msg}`); // Surface the error so the user knows what went wrong
      setIsSubmitting(false); // Clear loading on API error
    }
  }, [meta.id, execution]);

  // Loading state
  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080F1D', flexDirection: 'column', gap: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>
          <span style={{ fontSize: 18 }}>⚡</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="ff-spin" style={{ width: 16, height: 16, border: '2px solid rgba(96,165,250,0.2)', borderTop: '2px solid #60A5FA', borderRadius: '50%', display: 'inline-block' }} />
          <p style={{ fontSize: 13, color: '#4A6080', margin: 0, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Loading workflow…</p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col relative overflow-hidden">
        {/* Top Toolbar */}
        <EditorToolbar
          onToggleSettings={toggleSettings}
          onRun={handleRun}
          isRunning={isSubmitting}
          onToggleLog={() => setShowExecutionLog((prev) => !prev)}
          showLogIndicator={execution.logs.length > 0}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left — Node Palette */}
          <NodePalette />

          {/* Center — Flow Canvas */}
          <div className="flex-1 relative">
            <FlowCanvas nodeStatuses={execution.nodeStatuses} />
          </div>

          {/* Right — Node Config Panel */}
          <NodeConfigPanel />
        </div>

        {/* Bottom — Execution Log Panel */}
        <ExecutionLogPanel
          isOpen={showExecutionLog}
          onClose={() => setShowExecutionLog(false)}
          logs={execution.logs}
          executionStatus={execution.executionStatus}
        />

        {/* Workflow Settings Slide-over */}
        <WorkflowSettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    </ReactFlowProvider>
  );
}
