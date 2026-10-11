import * as React from 'react';

/**
 * Moldura de um nó editável dentro da folha.
 * `hover` filete vinho 45% · `active` filete vinho cheio · `data` tracejado tinta 30% (vitrine, agenda: modo amostra) ·
 * `sample` tracejado vinho (nó travado por dado externo). O filete sangra para fora para não empurrar o texto.
 */
export interface BlockFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: 'idle' | 'hover' | 'active' | 'data' | 'sample';
  type?: string;
  actions?: string[];
  /** Compensa o padding com margem negativa (padrão) para o texto não deslocar no hover. */
  bleed?: boolean;
}

export declare function BlockFrame(props: BlockFrameProps): JSX.Element;
