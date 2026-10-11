import * as React from 'react';

/** Cartão de número do painel: micro-label vinho + valor 30px em DCC Ash. */
export interface MetricCardProps extends React.HTMLAttributes<HTMLElement> {
  label: string;
  value: React.ReactNode;
  /** danger tinge o valor de vinho — só para falha de pagamento. */
  tone?: 'default' | 'danger';
  /** Rótulo da afordância quando o cartão é alvo. Padrão "Ver". */
  action?: string;
  href?: string;
  onClick?: React.MouseEventHandler;
}
export function MetricCard(props: MetricCardProps): JSX.Element;
