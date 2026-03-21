// ============================================
// FlowForge — Input Component
// 100% inline styles — guaranteed rendering
// ============================================

'use client';

import { InputHTMLAttributes, ReactNode, forwardRef, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, hint, className, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    const wrapStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 52,
      background: error ? '#FFF5F5' : '#ffffff',
      border: focused
        ? `1.5px solid ${error ? '#F87171' : '#3B82F6'}`
        : `1.5px solid ${error ? '#F87171' : '#CBD5E1'}`,
      borderRadius: 14,
      padding: '0 16px',
      boxShadow: focused
        ? `0 0 0 4px ${error ? 'rgba(248,113,113,0.12)' : 'rgba(59,130,246,0.12)'}`
        : '0 1px 2px rgba(0,0,0,0.04)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      ...style,
    };

    const inputStyle: React.CSSProperties = {
      flex: 1,
      height: '100%',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      fontSize: 15,
      color: '#0F172A',
    };

    return (
      <div style={{ width: '100%' }}>
        {label && (
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            {label}
          </label>
        )}

        <div style={wrapStyle}>
          {icon && (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: focused ? '#3B82F6' : '#94A3B8', flexShrink: 0, transition: 'color 0.2s' }}>
              {icon}
            </span>
          )}
          <input
            ref={ref}
            style={inputStyle}
            onFocus={e => { setFocused(true); props.onFocus?.(e); }}
            onBlur={e => { setFocused(false); props.onBlur?.(e); }}
            {...props}
          />
        </div>

        {hint && !error && (
          <p style={{ marginTop: 6, fontSize: 12, color: '#94A3B8' }}>{hint}</p>
        )}
        {error && (
          <p style={{ marginTop: 6, fontSize: 12, color: '#EF4444', fontWeight: 500 }}>⚠ {error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
