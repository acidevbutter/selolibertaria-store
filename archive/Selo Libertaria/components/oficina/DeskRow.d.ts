import * as React from 'react';

/**
 * Linha de lista do painel — 48px, divisor em tinta 8%, hover em tinta 4% com filete 20%.
 * Todo dado (id, data, valor, contagem, tipo) em mono com numeral tabular.
 *
 * @startingPoint section="Oficina" subtitle="Linha de 48px com dado em mono e estado" viewport="700x200"
 */
export interface DeskRowProps extends React.HTMLAttributes<HTMLElement> {
  title: React.ReactNode;
  /** Dado à direita, em mono 13 tabular. */
  data?: string;
  badge?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Selecionado = bloco sólido de tinta (listas da mesa) — vinho fica para a casca e para o índice de blocos. */
  selected?: boolean;
  hovered?: boolean;
  last?: boolean;
  as?: 'div' | 'a' | 'li';
}

export declare function DeskRow(props: DeskRowProps): JSX.Element;
