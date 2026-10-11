import React from 'react';
import { DeskRow } from '../oficina/DeskRow.jsx';

export const BLOCK_TYPES = [
  { type: 'heading', label: 'Título' },
  { type: 'paragraph', label: 'Parágrafo' },
  { type: 'list', label: 'Lista' },
  { type: 'quote', label: 'Citação' },
  { type: 'highlight', label: 'Destaque do selo' },
  { type: 'image', label: 'Imagem' },
  { type: 'gallery', label: 'Galeria' },
  { type: 'button', label: 'Botão' },
  { type: 'divider', label: 'Separador' },
  { type: 'productShelf', label: 'Vitrine de produtos' },
  { type: 'agenda', label: 'Agenda' },
];

/** Editor · menu de inserir bloco. Lista fechada de 11 tipos, linha de 48px, nome do schema em mono. */
export function BlockPicker({ items = BLOCK_TYPES, current, onPick, footer = 'Onze tipos. O servidor recusa qualquer outro com 422.', style, ...rest }) {
  return (
    <div style={{
      width: 'var(--ad-w-picker)', background: 'var(--ad-sheet)', border: '1px solid var(--ad-line)',
      display: 'flex', flexDirection: 'column', fontFamily: 'var(--ad-font-body)', ...style,
    }} {...rest}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--ad-line)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 'var(--ad-size-micro)', fontWeight: 900, letterSpacing: 'var(--ad-track-label)', textTransform: 'uppercase', color: 'rgba(11,11,11,.55)' }}>Inserir bloco</span>
        <span style={{ fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-micro)', color: 'var(--ad-text-faint)' }}>digite para filtrar</span>
      </div>
      {items.map((it, i) => (
        <DeskRow
          key={it.type} as="div" title={it.label} data={it.type}
          selected={it.type === current} last={i === items.length - 1}
          onClick={onPick ? () => onPick(it.type) : undefined}
          style={{ cursor: onPick ? 'pointer' : 'default' }}
        />
      ))}
      {footer && <div style={{ background: 'var(--ad-sand)', padding: '12px 18px', fontSize: 'var(--ad-size-support)', lineHeight: 'var(--ad-leading-body)', color: 'var(--ad-text-soft)' }}>{footer}</div>}
    </div>
  );
}
