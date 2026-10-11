import React from 'react';

export function MiniProductRow({ image, category, title, meta, price, framed = true, style, ...rest }) {
  return (
    <div style={{
      background: framed ? 'var(--sl-surface-card)' : 'transparent',
      border: framed ? '1px solid var(--sl-line-hairline)' : 'none',
      padding: framed ? 'var(--sl-space-5)' : 0,
      display: 'flex', gap: 'var(--sl-space-5)', alignItems: 'center', ...style,
    }} {...rest}>
      <div style={{ width: framed ? 56 : 48, height: framed ? 56 : 48, background: 'var(--sl-sand)', overflow: 'hidden', flex: 'none' }}>{image}</div>
      <div style={{ flex: 1 }}>
        {category && (
          <p style={{ margin: 0, fontSize: 'var(--sl-size-label-sm)', letterSpacing: '.2em',
            textTransform: 'uppercase', color: 'var(--sl-text-quiet)' }}>{category}</p>
        )}
        <p style={{ margin: '4px 0 0', fontFamily: framed ? 'var(--sl-font-display)' : 'var(--sl-font-body)',
          fontSize: framed ? '16px' : 'var(--sl-size-meta)', fontWeight: framed ? 400 : 700 }}>{title}</p>
        {meta && <p style={{ margin: '3px 0 0', fontSize: 'var(--sl-size-micro)', color: 'var(--sl-text-soft)' }}>{meta}</p>}
      </div>
      {price && <span style={{ fontSize: 'var(--sl-size-meta)', color: framed ? 'var(--sl-accent)' : 'var(--sl-text)' }}>{price}</span>}
    </div>
  );
}
