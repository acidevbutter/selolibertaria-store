import React from 'react';

export function ShippingOption({ label, price, selected = false, style, ...rest }) {
  return (
    <div style={{
      height: 'var(--sl-h-field)', border: `1px solid ${selected ? 'var(--sl-ink)' : 'var(--sl-line-strong)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'var(--sl-pad-field)', fontSize: 'var(--sl-size-meta)',
      color: selected ? 'var(--sl-text)' : 'var(--sl-text-muted)', cursor: 'pointer', ...style,
    }} {...rest}>
      <span>{label}</span>
      <span style={{ fontWeight: selected ? 'var(--sl-weight-strong)' : 400 }}>{price}</span>
    </div>
  );
}
