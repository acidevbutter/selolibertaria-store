import * as React from 'react';

/** Trilha caixa-alta da página de produto. O último item é vinho. */
export interface BreadcrumbProps extends React.HTMLAttributes<HTMLParagraphElement> {
  path?: string[];
}
export function Breadcrumb(props: BreadcrumbProps): JSX.Element;
