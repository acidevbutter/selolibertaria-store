import * as React from 'react';

/** Cartão salvo: bandeira em caixa preta, quatro últimos dígitos, titular e validade. */
export interface SavedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  brandSrc?: string;
  brandName?: string;
  last4?: string;
  holder?: string;
  expiry?: string;
  action?: string;
}
export function SavedCard(props: SavedCardProps): JSX.Element;
