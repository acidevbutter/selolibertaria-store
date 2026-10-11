import React from 'react';

export function SavedCard({ brandSrc, brandName = 'Visa', last4, holder, expiry, action = 'Usar', style, ...rest }) {
  return (
    <div style={{ border: '1px solid var(--sl-ink)', background: 'var(--sl-surface-card)', padding: 'var(--sl-space-6)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...style }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sl-space-5)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', height: 'var(--sl-h-chip)', padding: '0 8px', background: 'var(--sl-ink)' }}>
          {brandSrc
            ? <img src={brandSrc} alt={brandName} style={{ height: 12, width: 'auto', display: 'block', filter: 'invert(1) brightness(2)' }} />
            : <span style={{ color: 'var(--sl-text-on-ink)', fontSize: 10, fontWeight: 900, letterSpacing: '.12em' }}>{brandName.toUpperCase()}</span>}
        </span>
        <div>
          <p style={{ margin: 0, fontSize: 'var(--sl-size-meta)', fontWeight: 'var(--sl-weight-strong)' }}>•••• {last4}</p>
          <p style={{ margin: '3px 0 0', fontSize: 'var(--sl-size-micro)', color: 'var(--sl-text-soft)' }}>{holder} · {expiry}</p>
        </div>
      </div>
      <span style={{ fontSize: 'var(--sl-size-micro)', fontWeight: 'var(--sl-weight-label)',
        letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--sl-accent)', cursor: 'pointer' }}>{action}</span>
    </div>
  );
}
