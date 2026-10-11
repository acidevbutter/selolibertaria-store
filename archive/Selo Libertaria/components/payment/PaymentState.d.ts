import * as React from 'react';

/**
 * Os quatro estados do pagamento. Todo estado diz explicitamente se houve ou não cobrança.
 * @startingPoint section="Pagamento" subtitle="Processando, aprovado, recusado, aguardando" viewport="700x400"
 */
export interface PaymentStateProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: 'processing' | 'approved' | 'declined' | 'waiting';
  title?: string;
  body?: string;
  /** obrigatório em declined: sempre uma saída (pagar com Pix, outro cartão) */
  actions?: React.ReactNode;
  progress?: number;
}
export function PaymentState(props: PaymentStateProps): JSX.Element;
