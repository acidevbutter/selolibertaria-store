import * as React from 'react';

/**
 * Bloco `highlight` — a única "caixa de estilo" que a editora pode inserir, e ela vem fechada:
 * bege do selo, eyebrow em vinho, corpo em 16px. Ela escolhe o bloco, não a cor nem a fonte.
 */
export interface HighlightBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rótulo em mono; `null` esconde. */
  eyebrow?: string | null;
  children: React.ReactNode;
}

export declare function HighlightBlock(props: HighlightBlockProps): JSX.Element;
