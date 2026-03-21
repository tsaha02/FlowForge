'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflowStore';
import { NODE_TYPES } from '@/types/nodes';

interface WorkflowNodeData {
  nodeType: string;
  label: string;
  config: Record<string, unknown>;
  executionStatus?: string;
  executionError?: string;
  [key: string]: unknown;
}

function WorkflowNode({ id, data, selected }: NodeProps) {
  const setSelectedNode = useWorkflowStore(s => s.setSelectedNode);
  const nodeData = data as unknown as WorkflowNodeData;
  const typeDef  = NODE_TYPES[nodeData.nodeType];
  if (!typeDef) return null;

  const status    = nodeData.executionStatus;
  const isRunning = status === 'RUNNING';
  const isSuccess = status === 'SUCCESS';
  const isFailed  = status === 'FAILED';

  const borderColor = selected   ? '#3B82F6'
                    : isRunning  ? '#60A5FA'
                    : isSuccess  ? '#22C55E'
                    : isFailed   ? '#EF4444'
                    : '#E2E8F0';

  const shadowColor = selected  ? 'rgba(59,130,246,0.2)'
                    : isRunning ? 'rgba(59,130,246,0.15)'
                    : isSuccess ? 'rgba(34,197,94,0.15)'
                    : isFailed  ? 'rgba(239,68,68,0.15)'
                    : 'rgba(0,0,0,0.06)';

  return (
    <div
      onClick={() => setSelectedNode(id)}
      style={{
        background: '#ffffff',
        borderRadius: 14,
        border: `2px solid ${borderColor}`,
        minWidth: 210,
        maxWidth: 270,
        boxShadow: `0 4px 16px ${shadowColor}`,
        cursor: 'pointer',
        position: 'relative',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
        outline: isRunning ? '2px solid rgba(96,165,250,0.4)' : 'none',
        outlineOffset: 3,
      }}
    >
      {/* Color stripe on the left */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 5,
        borderRadius: '12px 0 0 12px',
        background: typeDef.color,
      }} />

      {/* Input handle */}
      {typeDef.inputs > 0 && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ width: 12, height: 12, background: '#CBD5E1', border: '2px solid #fff', top: -6 }}
        />
      )}

      {/* Content */}
      <div style={{ padding: '12px 14px 12px 18px' }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{typeDef.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nodeData.label || typeDef.label}
            </p>
            <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {typeDef.description}
            </p>
          </div>
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isRunning ? <Loader2 size={12} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} /> :
           isSuccess ? <CheckCircle2 size={12} color="#22C55E" /> :
           isFailed  ? <XCircle size={12} color="#EF4444" /> :
           <div style={{ width: 7, height: 7, borderRadius: '50%', background: typeDef.color }} />
          }
          <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {status || typeDef.category}
          </span>
        </div>

        {/* Error message */}
        {isFailed && nodeData.executionError && (
          <div style={{
            marginTop: 8, fontSize: 10, color: '#EF4444',
            background: '#FEF2F2', border: '1px solid #FEE2E2',
            borderRadius: 7, padding: '5px 8px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
          }} title={nodeData.executionError}>
            {nodeData.executionError}
          </div>
        )}
      </div>

      {/* Single output handle */}
      {typeDef.outputs === 1 && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ width: 12, height: 12, background: '#CBD5E1', border: '2px solid #fff', bottom: -6 }}
        />
      )}

      {/* Two output handles (condition node) */}
      {typeDef.outputs === 2 && (
        <>
          <Handle type="source" position={Position.Bottom} id="true"
            style={{ width: 12, height: 12, background: '#22C55E', border: '2px solid #fff', bottom: -6, left: '30%' }} />
          <Handle type="source" position={Position.Bottom} id="false"
            style={{ width: 12, height: 12, background: '#EF4444', border: '2px solid #fff', bottom: -6, left: '70%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 22% 8px', marginTop: -4 }}>
            <span style={{ fontSize: 9, color: '#22C55E', fontWeight: 700 }}>TRUE</span>
            <span style={{ fontSize: 9, color: '#EF4444', fontWeight: 700 }}>FALSE</span>
          </div>
        </>
      )}

      {/* Dynamic output handles (router node) */}
      {typeDef.type === 'router' && (() => {
        let branches: string[] = [];
        try {
          const rules = typeof nodeData.config?.branchRules === 'string'
            ? JSON.parse(nodeData.config.branchRules as string)
            : nodeData.config?.branchRules;
            
          if (Array.isArray(rules)) {
            branches = rules.map((r: any) => r.branch || 'unknown');
          }
        } catch {
          branches = ['invalid_json'];
        }
        
        if (branches.length === 0) branches = ['Configure Rules'];

        return (
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-evenly', padding: '0 10px 8px', marginTop: -4 }}>
            {branches.map((b, i) => (
              <div key={b + i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: `${100 / branches.length}%` }}>
                <span style={{ fontSize: 9, color: typeDef.color, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{b}</span>
                <Handle 
                  type="source" 
                  position={Position.Bottom} 
                  id={b}
                  style={{ width: 12, height: 12, background: typeDef.color, border: '2px solid #fff', bottom: -14, left: '50%', transform: 'translateX(-50%)' }} 
                />
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

export default memo(WorkflowNode);
