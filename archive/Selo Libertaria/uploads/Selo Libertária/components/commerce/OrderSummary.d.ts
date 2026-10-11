import * as React from 'react';

/** Subtotal + frete + total. O total é sempre o valor final — nada é somado depois. */
export interface OrderSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: Array<{ label: string; value: string }>;
  total: string;
  /** por padrão: "Valor final. Não há taxas adicionais na próxima etapa." */
  footnote?: string;
  on?: 'paper' | 'ink';
}
export function OrderSummary(props: OrderSummaryProps): JSX.Element;
