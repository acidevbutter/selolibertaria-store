import * as React from 'react';

/** Item do carrinho lateral (416px): miniatura 64px, categoria, título, quantidade e preço. */
export interface CartLineProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: React.ReactNode;
  /** "Livro · impresso", "Ingresso · 14 set" — categoria e variante na mesma linha */
  category?: string;
  title: React.ReactNode;
  quantity?: number;
  price: string;
}
export function CartLine(props: CartLineProps): JSX.Element;
