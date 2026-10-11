import * as React from 'react';

/**
 * Seletor de método. Não colapsa depois de escolhido — dá para trocar sem voltar etapa.
 * @startingPoint section="Pagamento" subtitle="Pix, cartão e boleto" viewport="700x140"
 */
export interface PaymentMethodTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  methods?: string[];
  active?: string;
  /** cards = três blocos com subtítulo (desktop) · strip = três botões de 52px (mobile) */
  variant?: 'cards' | 'strip';
}
export function PaymentMethodTabs(props: PaymentMethodTabsProps): JSX.Element;
