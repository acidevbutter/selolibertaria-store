import * as React from 'react';

/**
 * Cabeçalho de tela do painel — título em Fertigo 36px caixa-alta (28 no mobile), estado ao lado,
 * metadado em mono e ações à direita. Vem depois do `DeskBreadcrumb`, fora de qualquer folha.
 *
 * @startingPoint section="Oficina" subtitle="Título 36px com estado, metadado em mono e ações" viewport="1000x120"
 */
export interface DeskPageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  /** Normalmente um `<StateBadge />`. */
  badge?: React.ReactNode;
  /** Dado em mono: `editado 12 set 14:32 · por Marina`. */
  meta?: string;
  actions?: React.ReactNode;
}

export declare function DeskPageHeader(props: DeskPageHeaderProps): JSX.Element;
