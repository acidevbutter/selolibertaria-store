import React from 'react';

export function OrderSummary({ lines = [], total, footnote, on = 'paper', style, ...rest }) {
  const onInk = on === 'ink';
  const line = onInk ? 'var(--sl-line-on-ink)' : 'var(--sl-line-hairline)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-3)',
      fontSize: 'var(--sl-size-body-sm)', color: onInk ? 'var(--sl-text-on-ink)' : 'var(--sl-text)', ...style }} {...rest}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{l.label}</span><span>{l.value}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        borderTop: `1px solid ${line}`, paddingTop: 'var(--sl-space-4)' }}>
        <span style={{ fontWeight: 'var(--sl-weight-strong)' }}>Total</span>
        <span style={{ fontFamily: 'var(--sl-font-display)', fontSize: '28px' }}>{total}</span>
      </div>
      {footnote && (
        <p style={{ margin: 0, fontSize: 'var(--sl-size-micro)', color: onInk ? 'var(--sl-text-on-ink-soft)' : 'var(--sl-text-soft)' }}>{footnote}</p>
      )}
    </div>
  );
}
