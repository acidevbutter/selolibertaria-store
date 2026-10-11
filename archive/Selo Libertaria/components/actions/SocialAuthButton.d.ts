import * as React from 'react';

/** Botão de login por provedor externo, 48px, canto reto. Secundário ao e-mail. */
export interface SocialAuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider?: string;
  /** Caminho do arquivo oficial do provedor (assets/img/icons/). Obrigatório em produção. */
  iconSrc?: string;
  children?: React.ReactNode;
}
export function SocialAuthButton(props: SocialAuthButtonProps): JSX.Element;
