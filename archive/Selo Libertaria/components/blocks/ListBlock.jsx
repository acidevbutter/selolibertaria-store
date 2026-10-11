import React from 'react';

/** Bloco `list` · com marcador ou numerada, troca em um clique. */
export function ListBlock({ ordered = false, items = [], style, ...rest }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag style={{
      margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 8,
      fontFamily: 'var(--sl-font-body)', fontSize: 'var(--sl-size-body)',
      lineHeight: 'var(--sl-leading-body)', color: 'rgba(11,11,11,.85)', ...style,
    }} {...rest}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </Tag>
  );
}
