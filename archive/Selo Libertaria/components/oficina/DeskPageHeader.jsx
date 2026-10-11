import React from 'react';

/** Mesa · cabeçalho de tela: título 36px, estado, quem editou e as ações da página. */
export function DeskPageHeader({ title, badge, meta, actions, style, ...rest }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', fontFamily: 'var(--ad-font-body)', ...style }} {...rest}>
      <h1 style={{
        margin: 0, fontFamily: 'var(--ad-font-head)', fontSize: 'var(--ad-size-screen)',
        lineHeight: 'var(--ad-leading-head)', fontWeight: 900,
        letterSpacing: 'var(--ad-track-screen)', textTransform: 'uppercase',
      }}>{title}</h1>
      {badge}
      {meta && <span style={{ fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-data-sm)', color: 'rgba(11,11,11,.55)' }}>{meta}</span>}
      {actions && <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}
