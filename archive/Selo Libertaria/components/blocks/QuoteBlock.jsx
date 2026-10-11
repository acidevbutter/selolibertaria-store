import React from 'react';

/** Bloco `quote` · fio vinho de 4px à esquerda, corpo maior. Sai pronta — sem escolha de estilo. */
export function QuoteBlock({ children, cite, style, ...rest }) {
  return (
    <blockquote style={{ margin: 0, borderLeft: '4px solid var(--sl-wine)', padding: '4px 0 4px 20px', ...style }} {...rest}>
      <p style={{ margin: 0, fontFamily: 'var(--sl-font-body)', fontSize: 21, lineHeight: 1.5, color: 'var(--sl-ink)', textWrap: 'pretty' }}>{children}</p>
      {cite && <footer style={{ marginTop: 8, fontSize: 13, color: 'rgba(11,11,11,.6)' }}>{cite}</footer>}
    </blockquote>
  );
}
