import React from 'react';

/** Carregando · barra de 2px no topo da mesa. Substitui o overlay preto: a tela anterior continua legível. */
export function LoadingBar({ progress = 0.38, active = true, style, ...rest }) {
  return (
    <div role="progressbar" aria-hidden={!active} style={{
      height: 'var(--ad-h-loading)', background: 'rgba(11,11,11,.08)', position: 'relative', ...style,
    }} {...rest}>
      {active && <span style={{
        position: 'absolute', inset: 0, right: (100 - Math.max(0, Math.min(1, progress)) * 100) + '%',
        background: 'var(--ad-signal)', transition: 'var(--ad-transition)',
      }} />}
    </div>
  );
}
