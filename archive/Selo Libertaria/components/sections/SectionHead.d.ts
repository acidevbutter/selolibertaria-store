import * as React from 'react';

/** Título de seção 56px caixa-alta com filete e ação opcional à direita. */
export interface SectionHeadProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  action?: React.ReactNode;
  on?: 'paper' | 'ink';
  /** lg 56px · sm 44px */
  size?: 'lg' | 'sm';
}
export function SectionHead(props: SectionHeadProps): JSX.Element;
