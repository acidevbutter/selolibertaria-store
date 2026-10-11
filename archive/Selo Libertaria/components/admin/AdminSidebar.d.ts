import * as React from 'react';

export interface AdminNavItem {
  id: string;
  label: string;
  href?: string;
}

/**
 * Navegação do painel. 264px, fundo preto, canto reto (decisão: sem exceção de raio).
 * Selecionado = bloco sólido vinho de ponta a ponta, não fundo bege suave.
 */
export interface AdminSidebarProps extends React.HTMLAttributes<HTMLElement> {
  items?: AdminNavItem[];
  selectedId?: string;
  brand?: string;
  subtitle?: string;
  logoSrc?: string;
  session?: { name: string; email: string };
  onSelect?: (id: string) => void;
}
export function AdminSidebar(props: AdminSidebarProps): JSX.Element;
