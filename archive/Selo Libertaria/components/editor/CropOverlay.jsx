import React from 'react';
import { DeskButton } from '../oficina/DeskButton.jsx';
import { DeskField } from '../oficina/DeskField.jsx';
import { ShapePicker } from './ShapePicker.jsx';
import { CropArea } from './CropArea.jsx';
import { DropZone } from './DropZone.jsx';

const RATIOS = { cover: 3 / 4, wide: 16 / 9, square: 1 };

/** Editor · overlay de recorte. Escurece a casca e mantém a folha no centro: você não perdeu a página, só cobriu. */
export function CropOverlay({
  file, dimensions, src, targets, target = 'cover', onTarget,
  selection, onSelection, alt, onAlt, weight, dragOver = false,
  onCancel, onConfirm, style, ...rest
}) {
  const sel = selection || { x: 8, y: 12, w: 84, h: 62 };
  return (
    <div style={{ background: 'var(--ad-scrim)', padding: 36, display: 'flex', justifyContent: 'center', fontFamily: 'var(--ad-font-body)', ...style }} {...rest}>
      <div style={{ width: '100%', maxWidth: 820, background: 'var(--ad-sheet)', border: '1px solid var(--ad-line)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 'var(--ad-h-topbar)', background: 'var(--ad-shell)', color: 'var(--ad-on-shell)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px' }}>
          <span style={{ fontSize: 'var(--ad-size-body)', fontWeight: 900, letterSpacing: '-.02em', textTransform: 'uppercase' }}>Recortar imagem</span>
          <span style={{ fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-micro)', color: 'rgba(247,244,239,.5)' }}>{file}{dimensions ? ' · ' + dimensions : ''}</span>
          <span onClick={onCancel} style={{ marginLeft: 'auto', fontSize: 18, color: 'rgba(247,244,239,.7)', cursor: 'pointer' }}>✕</span>
        </div>

        {dragOver && <div style={{ padding: '18px 22px 0' }}>
          <DropZone over note="Solta aqui para trocar a foto deste bloco — o recorte atual é mantido." />
        </div>}

        <div style={{ padding: 22, display: 'flex', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 'none', width: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <CropArea src={src} ratio={RATIOS[target] || 3 / 4} selection={sel} onChange={onSelection} width={260} />
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'rgba(11,11,11,.6)' }}>Arraste o meio para mover e os cantos para mudar o tamanho. O que escurece fica fora.</p>
            <p style={{ margin: 0, fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-micro)', color: 'var(--ad-text-faint)' }}>
              {Math.round(sel.w)}% × {Math.round(sel.h)}% da foto
            </p>
          </div>
          <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ShapePicker
              label="Onde esta imagem vai aparecer" options={targets} current={target} onPick={onTarget}
              hint={null} style={{ border: 0, padding: 0, background: 'transparent' }}
            />
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'rgba(11,11,11,.55)' }}>A moldura muda de proporção junto: o recorte vale <strong>só neste bloco</strong>.</p>
            <DeskField
              as="textarea" label="Descreva a imagem" value={alt}
              onChange={onAlt} style={{ minHeight: 112, lineHeight: 1.6, resize: 'vertical' }}
              hint="Duas linhas bastam: quem aparece, o que acontece, onde. Serve para leitor de tela e para o Google achar a página."
            />
            {weight && <div style={{ background: 'var(--ad-sand)', padding: '12px 14px' }}>
              <p style={{ margin: 0, fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-data-sm)', lineHeight: 1.6, color: 'var(--ad-text-muted)' }}>{weight}</p>
            </div>}
          </div>
        </div>

        <div style={{ background: 'var(--ad-sand)', borderTop: '1px solid var(--ad-line)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--ad-size-support)', color: 'rgba(11,11,11,.65)' }}>O rascunho não recarrega: você volta com o cursor no mesmo ponto.</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <DeskButton variant="secondary" onClick={onCancel}>Cancelar</DeskButton>
            <DeskButton variant="primary" onClick={onConfirm}>Usar este recorte</DeskButton>
          </span>
        </div>
      </div>
    </div>
  );
}
