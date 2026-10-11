import * as React from 'react';

/**
 * Header preto do site. "Loja" substitui "Livros" — a nav nunca nomeia uma categoria.
 * @startingPoint section="Navegação" subtitle="Header desktop e mobile" viewport="1440x72"
 */
export interface SiteHeaderProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  /** ["Loja","Sarau Safado","Projetos","Sobre","Contato"] */
  items?: string[];
  active?: string;
  cartCount?: number;
  search?: string;
  variant?: 'desktop' | 'mobile';
}
export function SiteHeader(props: SiteHeaderProps): JSX.Element;
