import React from 'react';

/** Bloco `highlight` · Destaque do selo. Faixa bege com a cor e a tipografia da marca, pronta. */
export function HighlightBlock({ eyebrow = 'Destaque do selo', children, style, ...rest }) {
  return (
    <div style={{ background: 'var(--sl-sand)', padding: 20, display: 'flex', flexDirection: 'column', gap: 8, ...style }} {...rest}>
      {eyebrow && <p style={{
        margin: 0, fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-mono-label)',
        letterSpacing: 'var(--ad-track-label)', textTransform: 'uppercase', color: 'var(--sl-wine)',
      }}>{eyebrow}</p>}
      <p style={{ margin: 0, fontFamily: 'var(--sl-font-body)', fontSize: 'var(--sl-size-body)', lineHeight: 'var(--sl-leading-body)', color: 'rgba(11,11,11,.85)', textWrap: 'pretty' }}>{children}</p>
    </div>
  );
}
