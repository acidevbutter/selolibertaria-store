import React from 'react';

/** Editor · barrinha do bloco. 28px de tinta no canto superior direito, ações em mono separadas por filete. */
export function BlockToolbar({ type, actions = [], style, ...rest }) {
  const items = type ? [type, ...actions] : actions;
  return (
    <span style={{
      position: 'absolute', top: -14, right: -1, height: 'var(--ad-h-chip)',
      background: 'var(--ad-ink)', color: 'var(--ad-on-shell)', whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: 10, padding: '0 10px',
      fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-micro)', ...style,
    }} {...rest}>
      {items.map((a, i) => (
        <React.Fragment key={a}>
          {i > 0 && <span aria-hidden="true" style={{ color: 'rgba(247,244,239,.3)' }}>|</span>}
          <span style={{ cursor: 'pointer' }}>{a}</span>
        </React.Fragment>
      ))}
    </span>
  );
}
