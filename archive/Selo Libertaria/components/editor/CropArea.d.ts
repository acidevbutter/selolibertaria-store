import * as React from 'react';

export interface CropSelection {
  /** Percentuais da imagem: canto superior esquerdo e tamanho. */
  x: number; y: number; w: number; h: number;
}

/**
 * Área de recorte com seleção arrastável — a moldura de papel é o recorte.
 * Arraste o meio para mover, os cantos para redimensionar; o que fica fora escurece.
 * O resultado é gravado como `cropId` no nó do bloco: o arquivo original nunca é alterado.
 *
 * @startingPoint section="Oficina" subtitle="Recorte arrastável com quatro alças" viewport="300x380"
 */
export interface CropAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  /** Proporção do alvo do recorte (3/4 capa, 16/9 faixa larga, 1 quadrada). */
  ratio?: number;
  selection?: CropSelection;
  onChange?: (selection: CropSelection) => void;
  width?: number | string;
}

export declare function CropArea(props: CropAreaProps): JSX.Element;
