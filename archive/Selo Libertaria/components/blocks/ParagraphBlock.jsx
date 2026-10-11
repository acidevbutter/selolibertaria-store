import React from 'react';

/** Bloco `paragraph` · corpo de 17px. Negrito, itálico, sublinhado e link dentro do texto — nada de estilo próprio. */
export function ParagraphBlock({ children, style, ...rest }) {
  return (
    <p style={{
      margin: 0, fontFamily: 'var(--sl-font-body)', fontSize: 'var(--sl-size-lead)',
      lineHeight: 'var(--sl-leading-body-loose)', color: 'rgba(11,11,11,.85)',
      maxWidth: '60ch', textWrap: 'pretty', ...style,
    }} {...rest}>{children}</p>
  );
}
