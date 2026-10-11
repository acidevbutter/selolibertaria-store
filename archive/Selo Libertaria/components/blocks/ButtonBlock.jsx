import React from 'react';

/** Bloco `button` · aponta para produto, evento ou link externo. Um por bloco, vinho, 48px. */
export function ButtonBlock({ href = '#', children, align = 'left', style, ...rest }) {
  return (
    <div style={{ display: 'flex', justifyContent: align === 'center' ? 'center' : 'flex-start', ...style }} {...rest}>
      <a href={href} style={{
        height: 'var(--sl-h-button)', display: 'inline-flex', alignItems: 'center', padding: '0 24px',
        background: 'var(--sl-wine)', color: 'var(--sl-paper)', textDecoration: 'none',
        fontFamily: 'var(--sl-font-body)', fontSize: 12, fontWeight: 900,
        letterSpacing: 'var(--sl-track-label)', textTransform: 'uppercase', transition: 'var(--sl-transition)',
      }}>{children}</a>
    </div>
  );
}
