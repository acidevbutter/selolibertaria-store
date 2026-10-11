import React from 'react';

export function Breadcrumb({ path = [], style, ...rest }) {
  return (
    <p style={{ margin: 0, fontSize: 'var(--sl-size-micro)', letterSpacing: '.18em',
      textTransform: 'uppercase', color: 'var(--sl-text-soft)', ...style }} {...rest}>
      {path.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && ' / '}
          <span style={{ color: i === path.length - 1 ? 'var(--sl-accent)' : 'inherit' }}>{p}</span>
        </React.Fragment>
      ))}
    </p>
  );
}
