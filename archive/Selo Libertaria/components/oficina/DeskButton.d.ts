import * as React from 'react';

/**
 * Botão da mesa. `primary` (vinho) é a ação da tela — uma por tela. `secondary` é folha com filete 30%.
 * `ink` é ação neutra forte em listas. `tool` (36px) e `toolAccent` (vinho) só existem em barra de ferramentas.
 * Hover escurece 10–15%; press não transforma; foco = filete tinta + halo vinho.
 *
 * @startingPoint section="Oficina" subtitle="Primário vinho, secundário folha, botão de ferramenta 36px" viewport="700x120"
 */
export interface DeskButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ink' | 'tool' | 'toolAccent';
  /** Só em `tool`: ativo vira bloco de tinta com texto papel. */
  active?: boolean;
}

export declare function DeskButton(props: DeskButtonProps): JSX.Element;
