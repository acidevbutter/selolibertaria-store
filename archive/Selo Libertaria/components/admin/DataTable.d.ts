import * as React from 'react';

export interface DataColumn<Row = any> {
  key: string;
  label: string;
  /** Track do grid, ex. '140px' ou '1.4fr'. Padrão minmax(0,1fr). */
  width?: string;
  /** true = célula em DCC Ash 18px (pedido, total, quantidade). */
  numeric?: boolean;
  render?: (row: Row) => React.ReactNode;
}

/** Tabela compartilhada por /admin/pedidos, /admin/produtos e /admin/usuarios. */
export interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: DataColumn[];
  rows?: any[];
  /** Frase de saída do estado vazio — vai num quadro bege, nunca placeholder cinza. */
  empty?: React.ReactNode;
  zebra?: boolean;
}
export function DataTable(props: DataTableProps): JSX.Element;
