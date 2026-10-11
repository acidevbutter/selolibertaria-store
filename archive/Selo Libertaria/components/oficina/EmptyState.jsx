import React from 'react';

/** Mesa · vazio com saída. Quadro bege que explica e oferece o próximo passo — nunca só "nenhum resultado". */
export function EmptyState({ label, children, action, style, ...rest }) {
  return (
    <div style={{
      background: 'var(--ad-sand)', padding: '20px', display: 'flex', flexDirection: 'column',
      gap: 12, alignItems: 'flex-start', fontFamily: 'var(--ad-font-body)', ...style,
    }} {...rest}>
      {label && <span style={{ fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-data-sm)', color: 'var(--ad-text-soft)' }}>{label}</span>}
      <p style={{ margin: 0, fontSize: 'var(--ad-size-body)', lineHeight: 'var(--ad-leading-body)', color: 'var(--ad-text-muted)', maxWidth: '52ch' }}>{children}</p>
      {action}
    </div>
  );
}
