import React from 'react';

/** Editor · ponto de inserção. Tracejado com "+" de 28px e a frase que diz o que acontece no clique. */
export function InsertRow({ label = 'Clique para inserir um bloco aqui', onClick, style, ...rest }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
      borderTop: '1px dashed rgba(11,11,11,.25)', cursor: onClick ? 'pointer' : 'default',
      fontFamily: 'var(--ad-font-body)', ...style,
    }} {...rest}>
      <span style={{
        width: 'var(--ad-h-chip)', height: 'var(--ad-h-chip)', display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', border: '1px solid var(--ad-line-strong)', fontSize: 16, color: 'rgba(11,11,11,.55)',
      }}>+</span>
      <span style={{ fontSize: 14, color: 'var(--ad-text-quiet)' }}>{label}</span>
    </div>
  );
}
