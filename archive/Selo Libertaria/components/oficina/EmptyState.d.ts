import * as React from 'react';

/**
 * Estado vazio do painel — quadro bege com frase de saída e, quando existe, a ação que resolve.
 * Regra dura: estado vazio explica e oferece a saída; vazio sem saída é bug.
 */
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rótulo em mono: `Página vazia`, `Nenhum pedido neste período`. */
  label?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export declare function EmptyState(props: EmptyStateProps): JSX.Element;
