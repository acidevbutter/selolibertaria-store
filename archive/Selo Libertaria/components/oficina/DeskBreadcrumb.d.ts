import * as React from 'react';

/**
 * Caminho de volta da mesa — 13px, níveis em vinho, separador `›` em tinta 40%, último em tinta 900.
 * Toda subrota do painel tem breadcrumb: nenhuma tela fica sem saída.
 */
export interface DeskBreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  trail: Array<{ label: string; href?: string }>;
}

export declare function DeskBreadcrumb(props: DeskBreadcrumbProps): JSX.Element;
