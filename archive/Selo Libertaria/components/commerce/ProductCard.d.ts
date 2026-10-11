import * as React from 'react';

/**
 * Cartão único de produto — home, catálogo, busca e relacionados usam este e só este.
 * @startingPoint section="Comércio" subtitle="Livro, objeto, ingresso e esgotado" viewport="700x420"
 */
export interface ProductCardProps extends React.HTMLAttributes<HTMLElement> {
  /** <img> 1:1 já recortada; o cartão fornece a moldura bege */
  image?: React.ReactNode;
  category?: string;
  /** carimbo no canto da imagem: Pré-venda, Esgotado, Livro… */
  badge?: string;
  badgeTone?: 'ink' | 'buy' | 'paper';
  title: React.ReactNode;
  blurb?: string;
  price: string;
  /** estado à direita do preço: "Em estoque", "Envio 12 set", "3 vagas" */
  note?: string;
  action?: string;
  soldOut?: boolean;
  /** grade mobile de 2 colunas */
  compact?: boolean;
}
export function ProductCard(props: ProductCardProps): JSX.Element;
