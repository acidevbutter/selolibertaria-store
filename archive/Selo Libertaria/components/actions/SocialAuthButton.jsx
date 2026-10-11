import React from 'react';

/** Entrada por provedor externo. O ícone é SEMPRE arquivo real do provedor — nunca redesenhado. */
export function SocialAuthButton({ provider = 'Google', iconSrc, children, style, ...rest }) {
  return (
    <button type="button" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      width: '100%', height: 'var(--sl-h-button)', padding: 'var(--sl-pad-button)',
      background: 'var(--sl-paper-pure)', color: 'var(--sl-ink)',
      border: '1px solid var(--sl-line-strong)', borderRadius: 'var(--sl-radius)',
      font: 'inherit', fontSize: 'var(--sl-size-label)', fontWeight: 'var(--sl-weight-label)',
      letterSpacing: 'var(--sl-track-label)', textTransform: 'uppercase',
      cursor: 'pointer', transition: 'var(--sl-transition)', ...style,
    }} {...rest}>
      {iconSrc ? <img src={iconSrc} alt="" width={18} height={18} style={{ display: 'block' }} /> : null}
      {children || `Continuar com ${provider}`}
    </button>
  );
}
