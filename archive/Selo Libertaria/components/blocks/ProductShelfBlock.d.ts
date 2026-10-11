import * as React from 'react';

/**
 * Bloco `productShelf` — três títulos do catálogo. A editora escolhe as obras por busca;
 * preço, estoque e capa vêm do catálogo e NÃO são editáveis no bloco.
 * No editor o bloco entra em `sample`: moldura tracejada e valores mascarados.
 */
export interface ProductShelfBlockProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  items: Array<{ name: string; price?: string; meta?: string; src?: string; file?: string; href?: string }>;
  /** Modo amostra dentro do editor. */
  sample?: boolean;
}

export declare function ProductShelfBlock(props: ProductShelfBlockProps): JSX.Element;
