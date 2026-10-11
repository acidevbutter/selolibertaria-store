import React from 'react';

const COPY = { Pix: 'Aprovação imediata', 'Cartão': 'Até 6x sem juros', Boleto: 'Vence em 3 dias' };

export function PaymentMethodTabs({ methods = ['Pix', 'Cartão', 'Boleto'], active = 'Pix', variant = 'cards', style, ...rest }) {
  const cards = variant === 'cards';
  return (
    <div style={{
      display: cards ? 'grid' : 'flex',
      gridTemplateColumns: cards ? `repeat(${methods.length}, minmax(0,1fr))` : undefined,
      gap: cards ? 'var(--sl-space-5)' : 'var(--sl-space-3)', ...style,
    }} {...rest}>
      {methods.map((m) => {
        const on = m === active;
        return cards ? (
          <div key={m} style={{
            border: `1px solid ${on ? 'var(--sl-ink)' : 'rgba(11,11,11,.28)'}`,
            background: on ? 'var(--sl-paper)' : 'transparent',
            padding: 'var(--sl-space-7)', display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-2)', cursor: 'pointer',
          }}>
            <span style={{ fontSize: 'var(--sl-size-micro)', fontWeight: 'var(--sl-weight-label)',
              letterSpacing: 'var(--sl-track-label-tight)', textTransform: 'uppercase' }}>{m}</span>
            <span style={{ fontSize: 'var(--sl-size-meta-sm)', color: 'var(--sl-text-muted)' }}>{COPY[m]}</span>
          </div>
        ) : (
          <span key={m} style={{
            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: 'var(--sl-h-field)', background: on ? 'var(--sl-surface-card)' : 'transparent',
            border: `1px solid ${on ? 'var(--sl-ink)' : 'rgba(11,11,11,.28)'}`,
            fontSize: 'var(--sl-size-label)', fontWeight: 'var(--sl-weight-label)',
            letterSpacing: '.18em', textTransform: 'uppercase', cursor: 'pointer',
          }}>{m}</span>
        );
      })}
    </div>
  );
}
