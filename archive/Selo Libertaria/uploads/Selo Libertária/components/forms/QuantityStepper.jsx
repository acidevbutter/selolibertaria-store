import React from 'react';

export function QuantityStepper({ value = 1, on = 'paper', size = 'sm', style, ...rest }) {
  const onInk = on === 'ink';
  return (
    <div style={{
      height: size === 'field' ? 'var(--sl-h-field)' : 'var(--sl-h-small)',
      border: `1px solid ${onInk ? 'var(--sl-line-on-ink-mid)' : 'var(--sl-line-strong)'}`,
      borderRadius: 'var(--sl-radius)', display: 'inline-flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 'var(--sl-space-6)', padding: '0 12px',
      fontSize: 'var(--sl-size-body-sm)', color: onInk ? 'var(--sl-text-on-ink)' : 'var(--sl-text)',
      minWidth: 104, ...style,
    }} {...rest}>
      <span style={{ cursor: 'pointer' }}>−</span>
      <span>{value}</span>
      <span style={{ cursor: 'pointer' }}>+</span>
    </div>
  );
}
