import * as React from 'react';

export type OrderStatus = 'pago' | 'pendente' | 'enviado' | 'falhou' | 'cancelado';

/** Mapeia status de pedido para os tons fechados do Chip. Nenhuma cor nova. */
export interface OrderStatusChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: OrderStatus;
  children?: React.ReactNode;
}
export function OrderStatusChip(props: OrderStatusChipProps): JSX.Element;
