import * as React from 'react';

/**
 * Rodapé de ação da mesa — faixa bege com o estado do rascunho em mono e as ações da tela à direita.
 * O estado mora aqui: nenhum spinner cobre o texto que a pessoa está escrevendo.
 *
 * @startingPoint section="Oficina" subtitle="Faixa bege com estado em mono e Publicar em vinho" viewport="900x70"
 */
export interface ActionFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Dado em mono: `Rascunho salvo às 14:32`. */
  state?: string;
  /** Consequência em caixa normal: `só vai ao ar quando você publicar`. */
  note?: string;
  children?: React.ReactNode;
}

export declare function ActionFooter(props: ActionFooterProps): JSX.Element;
