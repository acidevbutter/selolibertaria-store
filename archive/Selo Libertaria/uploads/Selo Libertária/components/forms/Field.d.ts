import * as React from 'react';

/**
 * Campo editorial de 52px com rótulo persistente caixa-alta.
 * @startingPoint section="Formulário" subtitle="Repouso, foco e erro com ação" viewport="700x300"
 */
export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  value?: string;
  placeholder?: string;
  /** erro é vinho sobre lavagem 6%, nunca vermelho de sistema */
  state?: 'default' | 'focus' | 'error';
  on?: 'paper' | 'ink';
  /** texto de apoio; em erro, deve conter a saída ("informe o endereço manualmente") */
  hint?: string;
  suffix?: React.ReactNode;
}
export function Field(props: FieldProps): JSX.Element;
