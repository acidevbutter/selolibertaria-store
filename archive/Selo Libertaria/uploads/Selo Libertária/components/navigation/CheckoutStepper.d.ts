import * as React from 'react';

/** Três etapas do checkout: Identificação · Entrega · Pagamento. Nunca quatro. */
export interface CheckoutStepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps?: string[];
  current?: number;
  /** ink = dentro do header preto · paper = faixa bege no mobile */
  on?: 'ink' | 'paper';
}
export function CheckoutStepper(props: CheckoutStepperProps): JSX.Element;
