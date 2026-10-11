import React from 'react';

/** Editor · linha-guia de arraste. 2px vinho na largura da coluna com etiqueta — o único elemento animado. */
export function DropGuide({ label = 'Solta aqui', visible = true, style, ...rest }) {
  return (
    <div aria-hidden={!visible} style={{
      position: 'relative', height: 2, background: 'var(--ad-wine)',
      opacity: visible ? 1 : 0, transition: 'var(--ad-transition)', ...style,
    }} {...rest}>
      <span style={{
        position: 'absolute', left: 0, top: -11, height: 20, background: 'var(--ad-wine)', color: 'var(--ad-on-shell)',
        display: 'inline-flex', alignItems: 'center', padding: '0 8px', fontFamily: 'var(--ad-font-mono)',
        fontSize: 'var(--ad-size-mono-label)', letterSpacing: 'var(--ad-track-badge)', textTransform: 'uppercase',
      }}>{label}</span>
    </div>
  );
}
