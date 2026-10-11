import * as React from 'react';

/**
 * Índice de blocos da página — 230px, linha de 40px, índice `01` em mono, selecionado em bloco vinho.
 * É o que permite reordenar sem rolar a página no modo de edição sobre a própria página.
 *
 * @startingPoint section="Oficina" subtitle="Índice de 230px com linha de 40px e seleção vinho" viewport="230x320"
 */
export interface BlockOutlineProps extends React.HTMLAttributes<HTMLDivElement> {
  blocks: Array<{ id?: string | number; label: string }>;
  current?: string | number;
  onSelect?: (id: string | number) => void;
  note?: string | null;
}

export declare function BlockOutline(props: BlockOutlineProps): JSX.Element;
