import * as React from 'react';

/** Preço em DCC Ash. Todo número de dinheiro do site passa por aqui. */
export interface PriceTagProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  /** xl 44 (hero) · lg 40 (painel) · md 28 (total) · sm 22 (cartão) · xs 18 (linha) */
  size?: 'xl' | 'lg' | 'md' | 'sm' | 'xs';
  /** "ou 6x de R$ 12,00 sem juros" */
  aside?: string;
  muted?: boolean;
}
export function PriceTag(props: PriceTagProps): JSX.Element;
