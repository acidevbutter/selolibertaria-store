import React from 'react';
import { Chip } from '../actions/Chip.jsx';

const MAP = {
  pago:      { tone: 'sand',   label: 'Pago' },
  pendente:  { tone: 'quiet',  label: 'Pendente' },
  enviado:   { tone: 'ink',    label: 'Enviado' },
  falhou:    { tone: 'danger', label: 'Falhou' },
  cancelado: { tone: 'quiet',  label: 'Cancelado' },
};

/** Estado de pedido: quatro tons fechados, todos da paleta do selo. */
export function OrderStatusChip({ status, children, ...rest }) {
  const spec = MAP[String(status).toLowerCase()] || MAP.pendente;
  return <Chip tone={spec.tone} size="badge" {...rest}>{children || spec.label}</Chip>;
}
