import * as React from 'react';

/** Contador de quantidade: − valor + dentro de uma caixa reta de 44px (52px no painel de compra). */
export interface QuantityStepperProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  on?: 'paper' | 'ink';
  /** sm 44px (carrinho) · field 52px (painel de compra) */
  size?: 'sm' | 'field';
}
export function QuantityStepper(props: QuantityStepperProps): JSX.Element;
