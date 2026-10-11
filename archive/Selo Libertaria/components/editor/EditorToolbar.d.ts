import * as React from 'react';

export interface EditorToolButton {
  label: string;
  /** Ativo vira bloco de tinta com texto papel. */
  active?: boolean;
  /** Destaque do selo — bloco vinho. */
  accent?: boolean;
  /** Botão quadrado de 36px (B, I, U). */
  square?: boolean;
}

/**
 * Barra de ferramentas do editor — 14 controles em grupos separados por filete de 1px.
 * Nenhum controle de estilo: sem fonte, sem cor, sem tamanho, sem espaçamento. Só estrutura e ênfase.
 *
 * @startingPoint section="Oficina" subtitle="Faixa bege com 14 controles e desfazer em 10 passos" viewport="900x60"
 */
export interface EditorToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Grupos de botões, na ordem; cada grupo é separado por divisor. */
  groups: EditorToolButton[][];
  undoSteps?: number;
  canRedo?: boolean;
}

export declare function EditorToolbar(props: EditorToolbarProps): JSX.Element;
