import * as React from 'react';

/**
 * Bloco `heading` do `contentDoc` — só H2 (40px) e H3 (24px), em Fertigo 900 caixa-alta.
 * O H1 é o título da página, controlado pelo cabeçalho, nunca inserível.
 */
export interface HeadingBlockProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 2 | 3;
  children: React.ReactNode;
}

export declare function HeadingBlock(props: HeadingBlockProps): JSX.Element;
