'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ChevronDown, ChevronRight, X } from 'lucide-react';
import { NODE_CATEGORIES, NodeTypeDefinition } from '@/types/nodes';

const CAT_STYLES: Record<string, { accent: string; bg: string }> = {
  triggers:     { accent: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  actions:      { accent: '#2563EB', bg: 'rgba(37,99,235,0.12)'  },
  logic:        { accent: '#D97706', bg: 'rgba(217,119,6,0.12)'  },
  integrations: { accent: '#059669', bg: 'rgba(5,150,105,0.12)'  },
};

export default function NodePalette() {
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchFocused, setSearchFocused]   = useState(false);
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(['triggers', 'actions', 'logic', 'integrations']),
  );
  const [hoveredNode, setHoveredNode]       = useState<string | null>(null);

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
      width: 260,
      background: '#070D1A',
      borderRight: '1px solid #1A2540',
      display: 'flex', flexDirection: 'column',
      height: '100%', flexShrink: 0,
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 14px 12px',
        borderBottom: '1px solid #131D30',
        flexShrink: 0,
      }}>
        <p style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
          color: '#2D3F55', textTransform: 'uppercase', margin: '0 0 10px',
        }}>
          Node Palette
        </p>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          height: 34,
          background: searchFocused ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${searchFocused ? 'rgba(59,130,246,0.4)' : '#1A2540'}`,
          borderRadius: 8, padding: '0 10px',
          transition: 'border-color 0.15s, background 0.15s',
          boxShadow: searchFocused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
        }}>
          <Search size={12} style={{ color: '#2D3F55', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search nodes…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 12, color: '#94A3B8',
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#2D3F55', lineHeight: 1 }}>
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ── Node list ── */}
      <div
        className="scrollbar-dark"
        style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}
      >
        {NODE_CATEGORIES.map(category => {
          const cs = CAT_STYLES[category.category] || { accent: '#475569', bg: 'rgba(71,85,105,0.12)' };
          const filtered = category.types.filter(t =>
            !searchQuery ||
            t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase()),
          );
          if (filtered.length === 0 && searchQuery) return null;
          const isOpen  = openCategories.has(category.category);
          const display = searchQuery ? filtered : (isOpen ? category.types : []);

          return (
            <div key={category.category} style={{ marginBottom: 4 }}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category.category)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 10px', borderRadius: 7,
                  border: 'none',
                  background: cs.bg,
                  cursor: 'pointer',
                }}
              >
                {isOpen
                  ? <ChevronDown  size={11} style={{ color: cs.accent, flexShrink: 0 }} />
                  : <ChevronRight size={11} style={{ color: cs.accent, flexShrink: 0 }} />
                }
                <span style={{ flex: 1, textAlign: 'left', fontSize: 11, fontWeight: 700, color: cs.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {category.label}
                </span>
                <span style={{ fontSize: 10, color: cs.accent, opacity: 0.5, fontWeight: 600 }}>{category.types.length}</span>
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
                    <div style={{ paddingTop: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {display.map(nodeType => {
                        const isHov = hoveredNode === nodeType.type;
                        return (
                          <div
                            key={nodeType.type}
                            draggable
                            onDragStart={e => onDragStart(e, nodeType)}
                            onMouseEnter={() => setHoveredNode(nodeType.type)}
                            onMouseLeave={() => setHoveredNode(null)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 10px', borderRadius: 7, cursor: 'grab',
                              background: isHov ? 'rgba(255,255,255,0.05)' : 'transparent',
                              border: `1px solid ${isHov ? '#1A2540' : 'transparent'}`,
                              transition: 'all 0.12s',
                            }}
                          >
                            <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>{nodeType.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontSize: 12, fontWeight: 600,
                                color: isHov ? '#CBD5E1' : '#94A3B8',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                margin: 0, transition: 'color 0.12s',
                              }}>
                                {nodeType.label}
                              </p>
                              <p style={{
                                fontSize: 10, color: '#2D3F55',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                margin: '2px 0 0',
                              }}>
                                {nodeType.description}
                              </p>
                            </div>
                            {/* Color stripe */}
                            <div style={{
                              width: 3, height: 28, borderRadius: 2, flexShrink: 0,
                              background: nodeType.color,
                              opacity: isHov ? 0.7 : 0, transition: 'opacity 0.12s',
                            }} />
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid #131D30',
        flexShrink: 0,
      }}>
        <p style={{ fontSize: 10, color: '#1E2E42', textAlign: 'center', margin: 0 }}>
          Drag nodes onto the canvas
        </p>
      </div>
    </div>
  );
}
