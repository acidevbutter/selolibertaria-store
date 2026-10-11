import * as React from 'react';

export interface ShellSidebarItem {
  /** Chave da rota — comparada com `current` e `parent`. */
  id: string;
  label: string;
  href?: string;
  /** Contagem à direita, em mono 11. Omita quando não há número real. */
  count?: number | string;
}

export interface ShellSidebarGroup {
  /** Rótulo do grupo em mono 10 / .22em: Conteúdo · Operação · Sistema. */
  label: string;
  items: ShellSidebarItem[];
}

/**
 * Rail de navegação da casca — 264px de tinta, três grupos, item de 44px.
 * Selecionado é bloco sólido vinho; subrota marca o ITEM da subrota, nunca o grupo.
 *
 * @startingPoint section="Oficina" subtitle="Rail de 264px com três grupos e item selecionado em vinho" viewport="264x760"
 */
export interface ShellSidebarProps extends React.HTMLAttributes<HTMLElement> {
  groups: ShellSidebarGroup[];
  /** Item aceso (bloco vinho). */
  current?: string;
  /** Rota-pai de onde você veio — hover fraco. */
  parent?: string;
  /** Caminho do arquivo de logo (quadrado papel de 44px). */
  logo?: string;
  brand?: string;
  product?: string;
  user?: { name: string; capability: string };
}

export declare function ShellSidebar(props: ShellSidebarProps): JSX.Element;
