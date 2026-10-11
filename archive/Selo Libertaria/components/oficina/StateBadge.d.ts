import * as React from 'react';

/**
 * Estado de um registro — 24px, mono 11, caixa-alta.
 * `publicado` bege/vinho · `rascunho` filete tinta 30% · `emCurso` tinta sólida · `falha` lavagem vinho ·
 * `naCasca` papel sólido (único tom legível sobre a casca escura).
 *
 * @startingPoint section="Oficina" subtitle="Quatro estados na paleta do selo" viewport="420x40"
 */
export interface StateBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'publicado' | 'rascunho' | 'emCurso' | 'falha' | 'naCasca';
  children: React.ReactNode;
}

export declare function StateBadge(props: StateBadgeProps): JSX.Element;
