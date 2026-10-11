import React from 'react';

export function TrustList({ items = [], on = 'paper', framed = false, style, ...rest }) {
  const onInk = on === 'ink';
  return (
    <div style={{
      border: framed ? '1px solid var(--sl-line)' : 'none',
      background: framed ? 'var(--sl-surface-card)' : 'transparent',
      padding: framed ? 'var(--sl-space-8)' : 0,
      display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-5)', ...style,
    }} {...rest}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 'var(--sl-space-5)', alignItems: 'baseline' }}>
          <span style={{ color: 'var(--sl-accent)', fontWeight: 'var(--sl-weight-label)', flex: 'none' }}>✓</span>
          <p style={{ margin: 0, fontSize: 'var(--sl-size-meta)', lineHeight: 1.6,
            color: onInk ? 'var(--sl-text-on-ink-muted)' : 'var(--sl-text)' }}>{it}</p>
        </div>
      ))}
    </div>
  );
}
