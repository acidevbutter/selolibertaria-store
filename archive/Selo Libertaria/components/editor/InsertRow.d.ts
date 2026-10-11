import * as React from 'react';

/**
 * Ponto de inserção entre blocos, no fim da folha e em página vazia.
 * Abre o `BlockPicker` no primeiro clique — nenhuma tela a mais de dois cliques.
 */
export interface InsertRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export declare function InsertRow(props: InsertRowProps): JSX.Element;
