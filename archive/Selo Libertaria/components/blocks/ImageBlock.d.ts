import * as React from 'react';

/**
 * Bloco `image` do `contentDoc`: `{ assetId, cropId, layout, caption, href?, alt }`.
 * `wide` ocupa a coluna (padrão de quem arrasta e não mexe em mais nada) · `side` fica ao lado do texto,
 * com botão de virar, e empilha no celular · `center` para retrato, capa e documento · `gallery` delega ao `GalleryBlock`.
 *
 * @startingPoint section="Blocos" subtitle="As quatro formas nomeadas da imagem" viewport="700x320"
 */
export interface ImageBlockProps extends React.HTMLAttributes<HTMLElement> {
  src?: string;
  alt?: string;
  caption?: string;
  layout?: 'wide' | 'side' | 'center' | 'gallery';
  /** Só em `side`: troca o lado da imagem. */
  flip?: boolean;
  /** Só em `side`: o parágrafo que corre ao lado. */
  text?: React.ReactNode;
  /** Nome do arquivo em mono, quando ainda não há imagem real. */
  file?: string;
}

export declare function ImageBlock(props: ImageBlockProps): JSX.Element;
