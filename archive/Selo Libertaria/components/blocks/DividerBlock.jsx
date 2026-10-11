import React from 'react';

/** Bloco `divider` · respiro entre assuntos. Não tem variação. */
export function DividerBlock({ style, ...rest }) {
  return <hr style={{ border: 0, height: 1, background: 'rgba(11,11,11,.35)', margin: '8px 0', ...style }} {...rest} />;
}
