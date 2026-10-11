import * as React from 'react';

/**
 * Folha da mesa — o contêiner de tudo no painel.
 * `sheet` (filete 12%) é o padrão; `panel` (filete 20%) para painel com lista dentro;
 * `ink` para nota de sistema forte; `wine` para aviso; `sand` para faixa de apoio.
 *
 * @startingPoint section="Oficina" subtitle="Folha branca com eyebrow em mono — e os tons ink, wine e sand" viewport="700x260"
 */
export interface SheetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'sheet' | 'panel' | 'ink' | 'wine' | 'sand';
  /** Rótulo em mono 10 / .24em — vinho na folha, papel 55% sobre tinta. */
  eyebrow?: string;
  title?: string;
  pad?: number | string;
}

export declare function SheetCard(props: SheetCardProps): JSX.Element;
