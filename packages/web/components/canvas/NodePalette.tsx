'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { NODE_CATEGORIES, NodeTypeDefinition } from '@/types/nodes';

const CAT_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  triggers:     { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  actions:      { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  logic:        { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  integrations: { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
};

export default function NodePalette() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(['triggers', 'actions', 'logic', 'integrations']),
  );
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    const s = new Set(openCategories);
    if (s.has(cat)) s.delete(cat); else s.add(cat);
    setOpenCategories(s);
  };

  const onDragStart = (e: React.DragEvent, nodeType: NodeTypeDefinition) => {
    e.dataTransfer.setData('application/flowforge-node', nodeType.type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{
      width: 268,
      background: '#ffffff',
      borderRight: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
      boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12 }}>
          Node Palette
        </p>

        {/* Search bar — inline flex, no absolute positioning */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          height: 38,
          background: '#F8FAFC',
          border: `1.5px solid ${searchFocused ? '#3B82F6' : '#E2E8F0'}`,
          borderRadius: 10,
          padding: '0 12px',
          boxShadow: searchFocused ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}>
          <Search size={13} style={{ color: '#94A3B8', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#0F172A' }}
          />
        </div>
      </div>

      {/* Node list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
        {NODE_CATEGORIES.map(category => {
          const catStyle = CAT_STYLES[category.category] || { bg: '#F8FAFC', color: '#374151', border: '#E2E8F0' };
          const filtered = category.types.filter(t =>
            !searchQuery ||
            t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase()),
          );
          if (filtered.length === 0 && searchQuery) return null;
          const isOpen = openCategories.has(category.category);
          const display = searchQuery ? filtered : (isOpen ? category.types : []);

          return (
            <div key={category.category} style={{ marginBottom: 6 }}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category.category)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 10px',
                  borderRadius: 9,
                  border: `1px solid ${catStyle.border}`,
                  background: catStyle.bg,
                  color: catStyle.color,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {isOpen
                  ? <ChevronDown size={13} style={{ flexShrink: 0 }} />
                  : <ChevronRight size={13} style={{ flexShrink: 0 }} />
                }
                <span style={{ flex: 1, textAlign: 'left' }}>{category.label}</span>
                <span style={{ fontSize: 10, opacity: 0.6 }}>{category.types.length}</span>
              </button>

              {/* Node items */}
              <AnimatePresence>
                {display.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {display.map(nodeType => (
                        <div
                          key={nodeType.type}
                          draggable
                          onDragStart={e => onDragStart(e, nodeType)}
                          onMouseEnter={() => setHoveredNode(nodeType.type)}
                          onMouseLeave={() => setHoveredNode(null)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '9px 10px',
                            borderRadius: 9,
                            cursor: 'grab',
                            background: hoveredNode === nodeType.type ? '#F8FAFC' : 'transparent',
                            border: `1px solid ${hoveredNode === nodeType.type ? '#E2E8F0' : 'transparent'}`,
                            transition: 'all 0.12s',
                          }}
                        >
                          <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{nodeType.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                              {nodeType.label}
                            </p>
                            <p style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '2px 0 0' }}>
                              {nodeType.description}
                            </p>
                          </div>
                          {/* Color dot */}
                          <div style={{
                            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                            background: nodeType.color,
                            opacity: hoveredNode === nodeType.type ? 1 : 0,
                            transition: 'opacity 0.12s',
                          }} />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #F1F5F9', flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: '#CBD5E1', textAlign: 'center' }}>
          Drag nodes onto the canvas to build your workflow
        </p>
      </div>
    </div>
  );
}
