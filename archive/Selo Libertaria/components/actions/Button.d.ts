import * as React from 'react';

/**
 * Botão do selo: canto reto, label caixa-alta 900, três alturas.
 * @startingPoint section="Ações" subtitle="Compra, padrão, secundário, desabilitado" viewport="700x260"
 */
export interface ButtonProps extends React.HTMLAttributes<HTMLElement> {
  /** buy = vinho/vermelho, reservado a comprar-pagar-finalizar */
  variant?: 'buy' | 'primary' | 'secondary' | 'quiet';
  /** buy 56px · md 48px · sm 44px */
  size?: 'buy' | 'md' | 'sm';
  /** superfície onde o botão está apoiado */
  on?: 'paper' | 'ink';
  full?: boolean;
  disabled?: boolean;
  as?: 'button' | 'a' | 'span';
  children?: React.ReactNode;
}
export function Button(props: ButtonProps): JSX.Element;
