import * as React from 'react';

/** Lista de parcelas empilhada, sem dropdown. Selecionada = 52px com borda preta. */
export interface InstallmentListProps extends React.HTMLAttributes<HTMLDivElement> {
  options?: Array<{ times: string; value: string; note?: string; highlight?: boolean }>;
  selectedIndex?: number;
  note?: string;
}
export function InstallmentList(props: InstallmentListProps): JSX.Element;
