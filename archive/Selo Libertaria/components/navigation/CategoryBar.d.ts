import * as React from 'react';

/** Barra bege de categorias. Seis categorias fixas + contador de itens. */
export interface CategoryBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** ["Tudo · 28","Livros · 9","Edições sonoras · 4",…] — o contador faz parte do rótulo */
  items?: string[];
  active?: string;
  /** tabs = abas coladas de 56px (/loja) · pills = pastilhas de 44px (home) */
  variant?: 'tabs' | 'pills';
}
export function CategoryBar(props: CategoryBarProps): JSX.Element;
