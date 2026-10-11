import * as React from 'react';

/** Bloco `list` — 16px / 1.7, gap de 8. `ordered` alterna entre marcador e numeração; não há outra variação. */
export interface ListBlockProps extends React.HTMLAttributes<HTMLElement> {
  ordered?: boolean;
  items: React.ReactNode[];
}

export declare function ListBlock(props: ListBlockProps): JSX.Element;
