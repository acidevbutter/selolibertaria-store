import * as React from 'react';

/**
 * Bloco `button` — 48px em vinho, rótulo caixa-alta. Destino: produto, evento ou link externo.
 * Vermelho `--sl-red` é exclusivo do botão de compra da loja; um bloco de página nunca o usa.
 */
export interface ButtonBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  href?: string;
  children: React.ReactNode;
  align?: 'left' | 'center';
}

export declare function ButtonBlock(props: ButtonBlockProps): JSX.Element;
