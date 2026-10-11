import React from 'react';

/** Mesa · rodapé de ação. Faixa bege grudada no rodapé: estado à esquerda em mono, ações à direita. */
export function ActionFooter({ state, note, children, style, ...rest }) {
  return (
    <div style={{
      background: 'var(--ad-sand)', borderTop: '1px solid var(--ad-line)', padding: '12px 20px',
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      fontFamily: 'var(--ad-font-body)', ...style,
    }} {...rest}>
      {state && <span style={{ fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-data-sm)', color: 'var(--ad-text-soft)' }}>{state}</span>}
      {note && <span style={{ fontSize: 'var(--ad-size-meta, 14px)', color: 'rgba(11,11,11,.6)' }}>{note}</span>}
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>{children}</span>
    </div>
  );
}
