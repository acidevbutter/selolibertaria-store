import React from 'react';

export function PaymentState({ state = 'approved', title, body, actions, progress = 0.6, style, ...rest }) {
  if (state === 'processing') {
    return (
      <div style={{ border: '1px solid var(--sl-ink)', background: 'var(--sl-ink)', color: 'var(--sl-text-on-ink)',
        padding: 'var(--sl-space-7)', display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-2)', ...style }} {...rest}>
        <p style={{ margin: 0, fontSize: 'var(--sl-size-label)', fontWeight: 'var(--sl-weight-label)',
          letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--sl-text-on-ink-label)' }}>Processando</p>
        <p style={{ margin: 0, fontSize: 'var(--sl-size-body-sm)' }}>{body}</p>
        <div style={{ height: 6, background: 'rgba(247,244,239,.2)', marginTop: 'var(--sl-space-1)' }}>
          <div style={{ width: `${Math.round(progress * 100)}%`, height: 6, background: 'var(--sl-buy)' }} />
        </div>
      </div>
    );
  }
  if (state === 'approved') {
    return (
      <div style={{ border: '1px solid var(--sl-ink)', background: 'var(--sl-surface-card)', padding: 'var(--sl-space-7)',
        display: 'flex', gap: 'var(--sl-space-5)', alignItems: 'flex-start', ...style }} {...rest}>
        <span style={{ color: 'var(--sl-accent)', fontWeight: 900, fontSize: 18 }}>✓</span>
        <div>
          <p style={{ margin: 0, fontSize: 'var(--sl-size-body-sm)', fontWeight: 'var(--sl-weight-strong)' }}>{title}</p>
          <p style={{ margin: '5px 0 0', fontSize: 'var(--sl-size-meta-sm)', lineHeight: 1.55, color: 'var(--sl-text-muted)' }}>{body}</p>
        </div>
      </div>
    );
  }
  if (state === 'declined') {
    return (
      <div style={{ border: '1px solid var(--sl-wine)', background: 'rgba(122,30,34,.06)', padding: 'var(--sl-space-7)',
        display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)', ...style }} {...rest}>
        <p style={{ margin: 0, fontSize: 'var(--sl-size-body-sm)', fontWeight: 'var(--sl-weight-strong)', color: 'var(--sl-accent)' }}>{title}</p>
        <p style={{ margin: 0, fontSize: 'var(--sl-size-meta-sm)', lineHeight: 1.55, color: 'var(--sl-accent)' }}>{body}</p>
        {actions && <div style={{ display: 'flex', gap: 'var(--sl-space-3)' }}>{actions}</div>}
      </div>
    );
  }
  return (
    <div style={{ border: '1px solid rgba(11,11,11,.28)', background: 'var(--sl-surface-band)', padding: 'var(--sl-space-7)',
      display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-2)', ...style }} {...rest}>
      <p style={{ margin: 0, fontSize: 'var(--sl-size-body-sm)', fontWeight: 'var(--sl-weight-strong)' }}>{title}</p>
      <p style={{ margin: 0, fontSize: 'var(--sl-size-meta-sm)', lineHeight: 1.55, color: 'var(--sl-text-muted)' }}>{body}</p>
    </div>
  );
}
