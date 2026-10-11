import React from 'react';

export const IMAGE_SHAPES = [
  { layout: 'wide', label: 'Faixa larga' },
  { layout: 'side', label: 'Ao lado' },
  { layout: 'center', label: 'Centralizada' },
  { layout: 'gallery', label: 'Galeria' },
];

/** Editor · seletor de forma da imagem. Quatro formas nomeadas em chips de 28px — nunca largura em pixel. */
export function ShapePicker({ label = 'Escolha a forma', options = IMAGE_SHAPES, current = 'wide', onPick, hint = 'enter confirma · esc mantém faixa larga', style, ...rest }) {
  return (
    <div style={{ border: '1px solid var(--ad-line)', background: 'var(--ad-sheet)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--ad-font-body)', ...style }} {...rest}>
      {label && <span style={{ fontSize: 'var(--ad-size-micro)', fontWeight: 900, letterSpacing: 'var(--ad-track-label)', textTransform: 'uppercase', color: 'var(--ad-text-label)' }}>{label}</span>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map((o) => {
          const sel = o.layout === current;
          return (
            <span key={o.layout} onClick={onPick ? () => onPick(o.layout) : undefined} style={{
              height: 'var(--ad-h-chip)', display: 'inline-flex', alignItems: 'center', padding: '0 10px', fontSize: 12,
              background: sel ? 'var(--ad-ink)' : 'transparent', color: sel ? 'var(--ad-on-shell)' : 'var(--ad-text)',
              border: sel ? '1px solid var(--ad-ink)' : '1px solid var(--ad-line-tool)',
              cursor: onPick ? 'pointer' : 'default', transition: 'var(--ad-transition)',
            }}>{o.label}</span>
          );
        })}
      </div>
      {hint && <span style={{ fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-micro)', color: 'var(--ad-text-quiet)' }}>{hint}</span>}
    </div>
  );
}
