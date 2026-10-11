import * as React from 'react';

/** Cupom: campo + Aplicar, e a confirmação em vinho sobre lavagem 6% com "Remover" sempre visível. */
export interface CouponFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  applied?: boolean;
  code?: string;
  /** "−R$ 19,20" */
  discount?: string;
}
export function CouponField(props: CouponFieldProps): JSX.Element;
