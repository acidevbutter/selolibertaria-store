import * as React from 'react';

/**
 * Faixa de área travada no modo "editar na própria página" — cabeçalho, rodapé, preço e estoque.
 * Não recebe hover nem barrinha de bloco: o que está aqui não se edita na página.
 */
export interface LockedBarProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  /** Conteúdo real da área travada (nav, rodapé), renderizado inerte. */
  children?: React.ReactNode;
}

export declare function LockedBar(props: LockedBarProps): JSX.Element;
