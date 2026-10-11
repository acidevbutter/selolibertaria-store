import * as React from 'react';

/** Bloco `gallery` — 3 a 6 fotos em grade 1:1 com gap de 8. Fora dessa faixa o editor recusa e sugere a saída. */
export interface GalleryBlockProps extends React.HTMLAttributes<HTMLElement> {
  items: Array<{ src?: string; alt?: string; file?: string }>;
  caption?: string;
}

export declare function GalleryBlock(props: GalleryBlockProps): JSX.Element;
