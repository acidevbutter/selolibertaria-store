import React from 'react';

/** Editor · alvo de arraste de arquivo. Em repouso é tracejado sobre papel; com arquivo em cima, vira vinho. */
export function DropZone({ over = false, title = 'Arraste a foto aqui', hint = 'ou escolha do computador · JPG ou PNG até 8 MB', note, style, ...rest }) {
  return (
    <div style={{
      border: '2px dashed ' + (over ? 'var(--ad-wine)' : 'var(--ad-line-strong)'),
      background: over ? 'var(--ad-wine-wash)' : 'var(--ad-paper)',
      padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      textAlign: 'center', transition: 'var(--ad-transition)', fontFamily: 'var(--ad-font-body)', ...style,
    }} {...rest}>
      <span style={{ fontSize: 28, lineHeight: 1, color: 'var(--ad-wine)' }}>+</span>
      <p style={{ margin: 0, fontSize: 17, fontWeight: 900, letterSpacing: '-.02em', textTransform: 'uppercase' }}>{over ? 'Solta para subir' : title}</p>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--ad-text-quiet)' }}>{hint}</p>
      {note && <p style={{ margin: 0, fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-micro)', color: 'var(--ad-text-faint)' }}>{note}</p>}
    </div>
  );
}
