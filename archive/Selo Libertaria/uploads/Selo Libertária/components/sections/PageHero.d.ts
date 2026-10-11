import * as React from 'react';

/**
 * Cabeçalho preto de página — unifica home, loja, sarau, projetos, sobre, contato e FAQ.
 * @startingPoint section="Seções" subtitle="Hero preto com imagem 1:1 opcional" viewport="1440x520"
 */
export interface PageHeroProps extends React.HTMLAttributes<HTMLElement> {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: string;
  /** xl 96px (home) · md 60px (página interna) · sm 40px (mobile) */
  size?: 'xl' | 'md' | 'sm';
  actions?: React.ReactNode;
  /** imagem 1:1 à direita; sem ela o hero ocupa a largura toda */
  aside?: React.ReactNode;
  children?: React.ReactNode;
}
export function PageHero(props: PageHeroProps): JSX.Element;
