import React from 'react';

/** Mesa · caminho de volta. Acima do título de tela, nunca dentro de um cartão. */
export function DeskBreadcrumb({ trail = [], style, ...rest }) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--ad-size-support)', fontFamily: 'var(--ad-font-body)', flexWrap: 'wrap', ...style }} {...rest}>
      {trail.map((n, i) => {
        const last = i === trail.length - 1;
        return (
          <React.Fragment key={n.label}>
            {last
              ? <span style={{ color: 'var(--ad-text)', fontWeight: 900 }}>{n.label}</span>
              : <a href={n.href || '#'} style={{ color: 'var(--ad-wine)', textDecoration: 'none' }}>{n.label}</a>}
            {!last && <span aria-hidden="true" style={{ color: 'rgba(11,11,11,.4)' }}>›</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
