import * as React from 'react';

/** Lista de garantias com ✓ vinho: envio, troca, quem processa o pagamento. */
export interface TrustListProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: React.ReactNode[];
  on?: 'paper' | 'ink';
  framed?: boolean;
}
export function TrustList(props: TrustListProps): JSX.Element;
