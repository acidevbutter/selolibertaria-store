import * as React from 'react';
import { ShellSearchFieldProps } from './ShellSearchField';

/**
 * Topbar da casca — 56px de tinta, com busca global à esquerda e conta à direita.
 * Fica fixa: enquanto a mesa carrega, quem se mexe é a `LoadingBar`, não a casca.
 *
 * @startingPoint section="Oficina" subtitle="Topbar de 56px com busca ⌘K e conta" viewport="1160x56"
 */
export interface ShellTopbarProps extends React.HTMLAttributes<HTMLElement> {
  /** Mostra a busca global (padrão). */
  search?: boolean;
  searchProps?: ShellSearchFieldProps;
  siteHref?: string;
  siteLabel?: string;
  /** Iniciais da pessoa logada, em mono sobre quadrado papel. */
  initials?: string;
  /** Chips extras (ex.: alternador Editar / Ver do modo na própria página). */
  children?: React.ReactNode;
}

export declare function ShellTopbar(props: ShellTopbarProps): JSX.Element;
