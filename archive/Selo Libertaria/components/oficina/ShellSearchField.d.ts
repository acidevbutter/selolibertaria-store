import * as React from 'react';

/**
 * Campo de busca global da topbar — 34px sobre `--ad-shell-2`, glifo `⌕` e atalho em mono.
 * Único campo do sistema que vive na casca; todo outro campo é de 44px na mesa.
 */
export interface ShellSearchFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  placeholder?: string;
  /** Atalho exibido à direita. `null` esconde. */
  shortcut?: string | null;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  /** Filete em papel cheio quando o campo está com foco. */
  focused?: boolean;
}

export declare function ShellSearchField(props: ShellSearchFieldProps): JSX.Element;
