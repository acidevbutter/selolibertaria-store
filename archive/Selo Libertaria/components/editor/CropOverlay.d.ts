import * as React from 'react';
import { CropSelection } from './CropArea';

/**
 * Overlay de recorte — chamado de dentro do editor, por cima da casca escurecida em `--ad-scrim`.
 * Traz a seleção arrastável (`CropArea`), o alvo em formas nomeadas, a descrição em campo de duas
 * linhas e o peso do arquivo. Grava um `cropId` no nó: o original fica intacto na biblioteca.
 * Com arquivo pairando sobre a janela, mostra o `DropZone` em estado de arraste sem fechar o recorte.
 *
 * @startingPoint section="Oficina" subtitle="Recorte arrastável, alvo nomeado e descrição em duas linhas" viewport="900x600"
 */
export interface CropOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  file: string;
  /** `3024×4032` */
  dimensions?: string;
  /** Imagem real; sem ela a área mostra a hachura. */
  src?: string;
  /** Alvos do recorte: `[{ layout: 'cover', label: 'Capa do evento · 3:4' }]`. */
  targets?: Array<{ layout: string; label: string }>;
  target?: 'cover' | 'wide' | 'square' | string;
  onTarget?: (layout: string) => void;
  selection?: CropSelection;
  onSelection?: (selection: CropSelection) => void;
  alt?: string;
  onAlt?: React.ChangeEventHandler<HTMLTextAreaElement>;
  /** `2,1 MB → 240 KB · webp + jpg · usada em 3 lugares` */
  weight?: string;
  /** Arquivo sendo arrastado sobre a janela. */
  dragOver?: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
}

export declare function CropOverlay(props: CropOverlayProps): JSX.Element;
