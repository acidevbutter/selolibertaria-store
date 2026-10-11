import * as React from 'react';

/**
 * Alvo de arraste do painel — biblioteca de Imagens e overlay de recorte.
 * `over` (arquivo pairando sobre a janela) troca o tracejado e o fundo para vinho e muda o rótulo
 * para "Solta para subir": o estado de arraste precisa ser visível antes de soltar.
 */
export interface DropZoneProps extends React.HTMLAttributes<HTMLDivElement> {
  over?: boolean;
  title?: string;
  hint?: string;
  /** Linha extra em mono — limite, formatos, caminho alternativo. */
  note?: string;
}

export declare function DropZone(props: DropZoneProps): JSX.Element;
