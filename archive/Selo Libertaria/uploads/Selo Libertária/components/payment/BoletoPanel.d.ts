import * as React from 'react';

/** Painel de boleto: linha digitável, copiar, baixar PDF e a regra de quando ele não aparece. */
export interface BoletoPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  line?: string;
}
export function BoletoPanel(props: BoletoPanelProps): JSX.Element;
