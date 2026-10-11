import * as React from 'react';

/** Faixa bege com barra vinho: quanto falta para o frete grátis. Topo do carrinho. */
export interface FreeShippingMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  remaining: string;
  threshold: string;
  /** 0–1 */
  progress?: number;
}
export function FreeShippingMeter(props: FreeShippingMeterProps): JSX.Element;
