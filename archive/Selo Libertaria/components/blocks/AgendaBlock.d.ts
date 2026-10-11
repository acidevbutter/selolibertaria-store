import * as React from 'react';

/**
 * Bloco `agenda` — lista os eventos publicados, com data em DCC Ash e local em 13px.
 * Item com data passada sai da lista sozinho: a editora não precisa limpar a página.
 */
export interface AgendaBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  events: Array<{ when: string; title: string; place?: string; href?: string }>;
  /** Modo amostra dentro do editor. */
  sample?: boolean;
}

export declare function AgendaBlock(props: AgendaBlockProps): JSX.Element;
