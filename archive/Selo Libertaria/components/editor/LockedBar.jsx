import React from 'react';

/** Edição na própria página · área travada. Faixa de tinta com rótulo em mono; não recebe hover nem barrinha. */
export function LockedBar({ label = 'área travada', children, style, ...rest }) {
  return (
    <div style={{
      background: 'var(--ad-shell)', color: 'rgba(247,244,239,.6)', padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 14, overflow: 'hidden',
      fontFamily: 'var(--ad-font-body)', ...style,
    }} {...rest}>
      {children}
      <span style={{
        marginLeft: 'auto', flex: 'none', whiteSpace: 'nowrap', fontFamily: 'var(--ad-font-mono)',
        fontSize: 'var(--ad-size-micro)', letterSpacing: 'var(--ad-track-badge)', textTransform: 'uppercase',
      }}>{label}</span>
    </div>
  );
}
