import React from 'react';
import { Button } from '../actions/Button.jsx';

export function BoletoPanel({ line, style, ...rest }) {
  return (
    <div style={{ background: 'var(--sl-surface-page)', border: '1px solid var(--sl-line)',
      padding: 'var(--sl-space-10)', display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-6)', ...style }} {...rest}>
      <p style={{ margin: 0, fontSize: 'var(--sl-size-label-sm)', fontWeight: 'var(--sl-weight-label)',
        letterSpacing: 'var(--sl-track-label-wide)', textTransform: 'uppercase', color: 'var(--sl-accent)' }}>Boleto bancário</p>
      <p style={{ margin: 0, fontSize: 'var(--sl-size-meta)', lineHeight: 1.6 }}>
        Vence em 3 dias úteis. O pedido é separado após a confirmação do banco (até 2 dias úteis).
      </p>
      <div style={{ height: 'var(--sl-h-field)', border: '1px solid var(--sl-line-strong)',
        background: 'var(--sl-surface-card)', display: 'flex', alignItems: 'center', padding: '0 12px',
        fontSize: 'var(--sl-size-meta-sm)', color: 'var(--sl-text-soft)', overflow: 'hidden' }}>{line}</div>
      <div style={{ display: 'flex', gap: 'var(--sl-space-3)' }}>
        <Button variant="primary" full>Copiar linha</Button>
        <Button variant="secondary" full>Baixar PDF</Button>
      </div>
      <p style={{ margin: 0, fontSize: 'var(--sl-size-micro)', color: 'var(--sl-text-soft)' }}>
        Itens digitais e ingressos não aceitam boleto — o método some do seletor quando o carrinho só tem digitais.
      </p>
    </div>
  );
}
