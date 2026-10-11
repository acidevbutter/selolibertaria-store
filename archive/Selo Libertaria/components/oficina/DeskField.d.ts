import * as React from 'react';

/**
 * Campo do painel — 44px, filete tinta 30%, foco com filete sólido + halo vinho.
 * `mono` para dado (id, data, valor, dimensão). Erro sempre com frase de saída, não só cor.
 */
export interface DeskFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Apoio em 12px — o que o campo faz, em consequência concreta. */
  hint?: string;
  /** Mensagem de erro: diz o que fazer e o que não se perdeu. */
  error?: string;
  mono?: boolean;
  focused?: boolean;
  as?: 'input' | 'textarea';
  wrapStyle?: React.CSSProperties;
}

export declare function DeskField(props: DeskFieldProps): JSX.Element;
