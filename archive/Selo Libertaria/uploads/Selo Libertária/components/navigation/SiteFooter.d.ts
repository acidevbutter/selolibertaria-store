import * as React from 'react';

/** Rodapé papel com assinatura de newsletter e três colunas: Loja · Selo · Ajuda. */
export interface SiteFooterProps extends React.HTMLAttributes<HTMLElement> {
  blurb?: string;
  columns?: Array<{ title: string; links: string[] }>;
}
export function SiteFooter(props: SiteFooterProps): JSX.Element;
