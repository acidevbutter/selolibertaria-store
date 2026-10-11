import * as React from 'react';

/**
 * Bloco `paragraph` — 17px / 1.8, tinta 85%, medida máxima de 60ch.
 * Marcas permitidas dentro do texto: `strong`, `em`, `u`, `a`. HTML com estilo embutido é recusado pelo schema.
 */
export interface ParagraphBlockProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export declare function ParagraphBlock(props: ParagraphBlockProps): JSX.Element;
