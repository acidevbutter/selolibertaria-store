import * as React from 'react';

/** Linha compacta de produto: relacionados na PDP (framed) e resumo do pedido (framed={false}). */
export interface MiniProductRowProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: React.ReactNode;
  category?: string;
  title: React.ReactNode;
  meta?: string;
  price?: string;
  /** true = cartão de 56px com moldura (relacionados) · false = linha nua de 48px (resumo) */
  framed?: boolean;
}
export function MiniProductRow(props: MiniProductRowProps): JSX.Element;
