import React from 'react';
import { Button } from '../actions/Button.jsx';

export function PixPanel({ logo, code, expiresIn, qr, style, ...rest }) {
  return (
    <div style={{ background: 'var(--sl-surface-page)', border: '1px solid var(--sl-line)',
      padding: 'var(--sl-space-10)', display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-7)', ...style }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sl-space-4)' }}>
        {logo}
        <p style={{ margin: 0, fontSize: 'var(--sl-size-label-sm)', fontWeight: 'var(--sl-weight-label)',
          letterSpacing: 'var(--sl-track-label-wide)', textTransform: 'uppercase', color: 'var(--sl-accent)' }}>Pix · aprovação imediata</p>
      </div>
      <div style={{ display: 'flex', gap: 'var(--sl-space-7)', alignItems: 'flex-start' }}>
        <div style={{ width: 132, height: 132, flex: 'none', border: '1px solid var(--sl-ink)', background: 'var(--sl-surface-card)' }}>{qr}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
          <p style={{ margin: 0, fontSize: 'var(--sl-size-meta)', lineHeight: 1.6 }}>
            Escaneie no app do banco ou copie o código. O pedido é liberado em segundos.
          </p>
          <div style={{ height: 'var(--sl-h-field)', border: '1px solid var(--sl-line-strong)',
            background: 'var(--sl-surface-card)', display: 'flex', alignItems: 'center', padding: '0 12px',
            fontSize: 'var(--sl-size-meta-sm)', color: 'var(--sl-text-soft)', overflow: 'hidden' }}>{code}</div>
          <Button variant="primary" full>Copiar código Pix</Button>
        </div>
      </div>
      <div style={{ background: 'var(--sl-surface-band)', padding: '12px 14px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--sl-size-meta-sm)' }}>Expira em</span>
        <span style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-size-card-title)' }}>{expiresIn}</span>
      </div>
    </div>
  );
}
