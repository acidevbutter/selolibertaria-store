import React from 'react';
import { BlockToolbar } from './BlockToolbar.jsx';

/** Editor · moldura do nó editável. Filete vinho no hover, tracejado para bloco de dados, barrinha no canto. */
export function BlockFrame({ state = 'idle', type, actions, bleed = true, children, style, ...rest }) {
  const border = {
    idle: '1px solid transparent',
    hover: '1px solid var(--ad-block-line)',
    active: '1px solid var(--ad-wine)',
    data: '1px dashed rgba(11,11,11,.3)',
    sample: '1px dashed rgba(122,30,34,.5)',
  }[state];
  return (
    <div style={{
      position: 'relative', border, padding: '8px 10px',
      margin: bleed ? '-8px -10px' : 0, transition: 'var(--ad-transition)', ...style,
    }} {...rest}>
      {(state === 'hover' || state === 'active') && actions && <BlockToolbar type={type} actions={actions} />}
      {children}
    </div>
  );
}
