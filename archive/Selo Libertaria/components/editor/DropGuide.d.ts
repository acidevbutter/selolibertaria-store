import * as React from 'react';

/**
 * Linha-guia de arraste — 2px vinho, largura da coluna de texto, etiqueta `solta aqui` em mono 10.
 * Só aparece ENTRE blocos, nunca no meio de uma frase. Entra e sai em 120ms.
 */
export interface DropGuideProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  visible?: boolean;
}

export declare function DropGuide(props: DropGuideProps): JSX.Element;
