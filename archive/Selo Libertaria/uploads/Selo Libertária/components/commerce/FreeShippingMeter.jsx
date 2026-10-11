import React from 'react';

export function FreeShippingMeter({ remaining, threshold, progress = 0.96, style, ...rest }) {
  return (
    <div style={{ background: 'var(--sl-surface-band)', padding: '14px var(--sl-space-8)',
      display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-3)', ...style }} {...rest}>
      <p style={{ margin: 0, fontSize: 'var(--sl-size-meta-sm)', fontWeight: 'var(--sl-weight-strong)' }}>
        Faltam {remaining} para o frete grátis{' '}
        <span style={{ fontWeight: 400, color: 'var(--sl-text-soft)' }}>(acima de {threshold})</span>
      </p>
      <div style={{ height: 8, background: 'rgba(11,11,11,.16)' }}>
        <div style={{ width: `${Math.round(progress * 100)}%`, height: 8, background: 'var(--sl-wine)' }} />
      </div>
    </div>
  );
}
