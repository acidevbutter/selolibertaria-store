import * as React from 'react';

/** Bandeiras aceitas. Marca sem SVG vira wordmark em caixa reta — nunca logo colorido reconstruído. */
export interface CardBrandRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** { name: 'Visa', src?: 'assets/img/icons/visa.svg' } */
  brands?: Array<{ name: string; src?: string }>;
  active?: string;
  /** field 52px (seletor no formulário) · chip 26px (rodapé do resumo) */
  size?: 'field' | 'chip';
}
export function CardBrandRow(props: CardBrandRowProps): JSX.Element;
