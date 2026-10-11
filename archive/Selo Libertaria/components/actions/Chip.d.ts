import * as React from 'react';

/** Etiqueta curta: categoria, estado de estoque, filtro, bandeira. 24–26px, caixa-alta. */
export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'solid' | 'ink' | 'buy' | 'sand' | 'paper' | 'outline' | 'danger' | 'quiet';
  on?: 'paper' | 'ink';
  /** badge = 24px, para carimbar o canto de uma imagem */
  size?: 'chip' | 'badge';
  children?: React.ReactNode;
}
export function Chip(props: ChipProps): JSX.Element;
