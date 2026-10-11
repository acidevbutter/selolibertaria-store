import * as React from 'react';

/** Painel Pix: QR, código copiável e contagem regressiva de 30 minutos em faixa bege. */
export interface PixPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  logo?: React.ReactNode;
  code?: string;
  /** "29:41" — em DCC Ash */
  expiresIn?: string;
  qr?: React.ReactNode;
}
export function PixPanel(props: PixPanelProps): JSX.Element;
