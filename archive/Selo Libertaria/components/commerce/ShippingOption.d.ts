import * as React from 'react';

/** Opção de frete de 52px. Selecionada = borda preta sólida + preço em 700. */
export interface ShippingOptionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** "PAC · 5 dias úteis" — transportadora e prazo sempre juntos */
  label: string;
  price: string;
  selected?: boolean;
}
export function ShippingOption(props: ShippingOptionProps): JSX.Element;
