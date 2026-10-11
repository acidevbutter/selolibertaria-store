import React from 'react';
import { Button } from '../actions/Button.jsx';
import { Field } from '../forms/Field.jsx';

export function CouponField({ applied, code, discount, style, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-6)', ...style }} {...rest}>
      <div style={{ display: 'flex', gap: 'var(--sl-space-3)', alignItems: 'flex-end' }}>
        <Field placeholder="Cupom" style={{ flex: 1 }} />
        <Button variant="secondary" style={{ height: 'var(--sl-h-field)' }}>Aplicar</Button>
      </div>
      {applied && (
        <div style={{ border: '1px solid var(--sl-wine)', background: 'rgba(122,30,34,.06)',
          padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'var(--sl-size-meta)', color: 'var(--sl-accent)' }}>
            <strong>{code}</strong> aplicado · {discount}
          </span>
          <span style={{ fontSize: 'var(--sl-size-micro)', fontWeight: 'var(--sl-weight-label)',
            letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--sl-accent)', cursor: 'pointer' }}>Remover</span>
        </div>
      )}
    </div>
  );
}
