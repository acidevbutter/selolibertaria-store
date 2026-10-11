import React from 'react';

export function CategoryBar({ items = [], active, variant = 'tabs', style, ...rest }) {
  const tabs = variant === 'tabs';
  return (
    <div style={{
      background: 'var(--sl-surface-band)',
      padding: tabs ? '0 var(--sl-gutter-desktop)' : '20px var(--sl-gutter-desktop)',
      display: 'flex', alignItems: tabs ? 'stretch' : 'center', gap: tabs ? 0 : 'var(--sl-space-3)',
      borderBottom: tabs ? '1px solid rgba(11,11,11,.16)' : 'none', overflow: 'hidden', ...style,
    }} {...rest}>
      {items.map((it) => {
        const on = it === active;
        return (
          <span key={it} style={{
            display: 'inline-flex', alignItems: 'center', flex: 'none',
            height: tabs ? 'var(--sl-h-tab)' : 'var(--sl-h-small)',
            padding: tabs ? '0 20px' : '0 16px',
            background: on ? 'var(--sl-ink)' : 'transparent',
            color: on ? 'var(--sl-text-on-ink)' : 'var(--sl-text-muted)',
            border: !tabs && !on ? '1px solid var(--sl-line-strong)' : 'none',
            fontSize: 'var(--sl-size-label)', fontWeight: 'var(--sl-weight-label)',
            letterSpacing: 'var(--sl-track-label-tight)', textTransform: 'uppercase', cursor: 'pointer',
          }}>{it}</span>
        );
      })}
    </div>
  );
}
