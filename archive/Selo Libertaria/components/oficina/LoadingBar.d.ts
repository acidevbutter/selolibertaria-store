import * as React from 'react';

/**
 * Indicador de carregamento do painel — 2px em `--ad-signal` no topo da área de conteúdo.
 * É o ÚNICO indicador de espera do sistema: nunca overlay preto, nunca spinner sobre o texto.
 */
export interface LoadingBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0 a 1. */
  progress?: number;
  active?: boolean;
}

export declare function LoadingBar(props: LoadingBarProps): JSX.Element;
