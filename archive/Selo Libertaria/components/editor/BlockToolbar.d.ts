import * as React from 'react';

/**
 * Barrinha de ações de um bloco — aparece no hover, colada no canto superior direito, DENTRO da folha.
 * Texto de imagem: `Recortar · Trocar · Legenda · Mover ⇅ · Remover`; texto puro: `Mover ⇅ · Duplicar · Remover`.
 */
export interface BlockToolbarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Nome do tipo no schema (`paragraph`, `image`) — exibido no modo de edição na própria página. */
  type?: string;
  actions?: string[];
}

export declare function BlockToolbar(props: BlockToolbarProps): JSX.Element;
