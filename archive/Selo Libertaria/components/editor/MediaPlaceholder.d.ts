import * as React from 'react';

/**
 * Quadro de imagem ainda sem arquivo — hachura bege 135° com o nome e a proporção em mono.
 * Quando falta imagem real, o quadro bege é melhor resposta do que um placeholder cinza.
 */
export interface MediaPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `sarau-14-publico.jpg · 4:3` */
  caption?: string;
  ratio?: string;
  height?: number | string;
}

export declare function MediaPlaceholder(props: MediaPlaceholderProps): JSX.Element;
