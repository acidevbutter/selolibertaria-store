import * as React from 'react';

/** Bloco `quote` — 21px / 1.5 com fio vinho de 4px. `cite` opcional em 13px. */
export interface QuoteBlockProps extends React.HTMLAttributes<HTMLQuoteElement> {
  children: React.ReactNode;
  cite?: string;
}

export declare function QuoteBlock(props: QuoteBlockProps): JSX.Element;
