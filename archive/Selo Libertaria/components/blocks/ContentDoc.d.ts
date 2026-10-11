import * as React from 'react';

export type ContentNode =
  | { id?: string; type: 'heading'; level?: 2 | 3; text: string }
  | { id?: string; type: 'paragraph'; text: React.ReactNode }
  | { id?: string; type: 'list'; ordered?: boolean; items: React.ReactNode[] }
  | { id?: string; type: 'quote'; text: string; cite?: string }
  | { id?: string; type: 'highlight'; text: string; eyebrow?: string | null }
  | { id?: string; type: 'image'; layout?: 'wide' | 'side' | 'center' | 'gallery'; src?: string; file?: string; alt?: string; caption?: string; text?: React.ReactNode; flip?: boolean }
  | { id?: string; type: 'gallery'; items: Array<{ src?: string; file?: string; alt?: string }>; caption?: string }
  | { id?: string; type: 'button'; label: string; href?: string; align?: 'left' | 'center' }
  | { id?: string; type: 'divider' }
  | { id?: string; type: 'productShelf'; title?: string; items: Array<{ name: string; price?: string; meta?: string; file?: string; src?: string }> }
  | { id?: string; type: 'agenda'; events: Array<{ when: string; title: string; place?: string }> };

/**
 * Renderer único do documento de nós. Use o MESMO componente no editor, na prévia e na página publicada —
 * nenhum nó carrega estilo próprio e nada passa por `dangerouslySetInnerHTML`.
 * `editable` emite `data-node-id` em cada nó, para casar clique na tela com nó do `contentDoc`.
 *
 * @startingPoint section="Blocos" subtitle="Documento de nós renderizado — os 11 tipos" viewport="780x900"
 */
export interface ContentDocProps extends React.HTMLAttributes<HTMLDivElement> {
  doc: ContentNode[];
  /** Modo edição: emite `data-node-id` e `data-node-type` por nó. */
  editable?: boolean;
  /** Vitrine e agenda em modo amostra (dentro do editor). */
  sample?: boolean;
  gap?: number;
}

export declare function ContentDoc(props: ContentDocProps): JSX.Element;
