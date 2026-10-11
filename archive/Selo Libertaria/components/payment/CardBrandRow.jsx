import React from 'react';

export function CardBrandRow({ brands = [], active, size = 'field', style, ...rest }) {
  const tall = size === 'field';
  return (
    <div style={{
      display: tall ? 'grid' : 'flex', flexWrap: tall ? undefined : 'wrap',
      gridTemplateColumns: tall ? `repeat(${brands.length}, minmax(0,1fr))` : undefined,
      gap: tall ? 'var(--sl-space-3)' : 'var(--sl-space-2)', ...style,
    }} {...rest}>
      {brands.map((b) => {
        const on = b.name === active;
        return (
          <span key={b.name} style={{
            height: tall ? 'var(--sl-h-field)' : 'var(--sl-h-chip)',
            padding: tall ? '0 10px' : '0 9px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: on ? 'var(--sl-ink)' : 'transparent',
            border: on ? 'none' : '1px solid rgba(11,11,11,.28)',
            fontSize: tall ? 'var(--sl-size-micro)' : 'var(--sl-size-label-sm)',
            fontWeight: 'var(--sl-weight-label)', letterSpacing: '.12em',
            color: on ? 'var(--sl-text-on-ink)' : 'rgba(11,11,11,.75)',
          }}>
            {b.src
              ? <img src={b.src} alt={b.name} style={{ height: tall ? 20 : 14, width: 'auto', display: 'block', filter: on ? 'invert(1) brightness(2)' : undefined }} />
              : b.name.toUpperCase()}
          </span>
        );
      })}
    </div>
  );
}
