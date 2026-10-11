import * as React from 'react';

/**
 * Seletor de forma — abre no bloco recém-criado ao soltar uma foto, e na barrinha depois.
 * Quatro formas nomeadas (`wide | side | center | gallery`): canto livre e largura em pixel não existem no sistema.
 *
 * @startingPoint section="Oficina" subtitle="Quatro formas nomeadas em chips de 28px" viewport="420x120"
 */
export interface ShapePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  options?: Array<{ layout: string; label: string }>;
  current?: 'wide' | 'side' | 'center' | 'gallery' | string;
  onPick?: (layout: string) => void;
  hint?: string | null;
}

export declare const IMAGE_SHAPES: Array<{ layout: string; label: string }>;
export declare function ShapePicker(props: ShapePickerProps): JSX.Element;
