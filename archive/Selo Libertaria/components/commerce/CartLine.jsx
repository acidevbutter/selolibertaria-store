import React from 'react';
import { QuantityStepper } from '../forms/QuantityStepper.jsx';

export function CartLine({ image, category, title, quantity = 1, price, style, ...rest }) {
  return (
    <div style={{
      padding: '18px 0', borderBottom: '1px solid var(--sl-line-hairline)',
      display: 'flex', gap: 'var(--sl-space-6)', ...style,
    }} {...rest}>
      <div style={{ width: 64, height: 64, background: 'var(--sl-sand)', overflow: 'hidden', flex: 'none' }}>{image}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-3)' }}>
        {category && (
          <p style={{ margin: 0, fontSize: 'var(--sl-size-label-sm)', letterSpacing: '.2em',
            textTransform: 'uppercase', color: 'var(--sl-text-quiet)' }}>{category}</p>
        )}
        <p style={{ margin: 0, fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-size-card-title-sm)' }}>{title}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <QuantityStepper value={quantity} />
          <span style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-size-card-title-sm)' }}>{price}</span>
        </div>
      </div>
    </div>
  );
}
