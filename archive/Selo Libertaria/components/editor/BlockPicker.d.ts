import * as React from 'react';

/**
 * Menu do "+" — os 11 tipos inseríveis, cada um com o nome do schema em mono à direita.
 * Lista FECHADA: nenhum tipo novo entra sem mudar o schema (tipo fora da lista devolve 422).
 *
 * @startingPoint section="Oficina" subtitle="Os 11 blocos inseríveis, linha de 48px" viewport="360x620"
 */
export interface BlockPickerProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: Array<{ type: string; label: string }>;
  /** Tipo destacado (bloco de tinta). */
  current?: string;
  onPick?: (type: string) => void;
  /** Nota de rodapé em faixa bege; `null` esconde. */
  footer?: string | null;
}

export declare const BLOCK_TYPES: Array<{ type: string; label: string }>;
export declare function BlockPicker(props: BlockPickerProps): JSX.Element;
