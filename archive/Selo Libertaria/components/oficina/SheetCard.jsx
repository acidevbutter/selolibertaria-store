import React from 'react';

const TONES = {
  sheet: { background: 'var(--ad-sheet)', border: '1px solid var(--ad-line-sheet)', color: 'var(--ad-text)' },
  panel: { background: 'var(--ad-sheet)', border: '1px solid var(--ad-line)', color: 'var(--ad-text)' },
  ink:   { background: 'var(--ad-ink)', color: 'var(--ad-on-shell)' },
  wine:  { background: 'var(--ad-wine-wash)', border: '1px solid var(--ad-wine-line)', color: 'var(--ad-text)' },
  sand:  { background: 'var(--ad-sand)', color: 'var(--ad-text)' },
};

/** Mesa · folha. Cartão de conteúdo com eyebrow em mono; quatro tons para nota, painel e aviso. */
export function SheetCard({ tone = 'sheet', eyebrow, title, pad = 20, children, style, ...rest }) {
  const onInk = tone === 'ink';
  return (
    <div style={{ padding: pad, fontFamily: 'var(--ad-font-body)', borderRadius: 'var(--ad-radius)', display: 'flex', flexDirection: 'column', gap: 10, ...TONES[tone], ...style }} {...rest}>
      {eyebrow && <p style={{
        margin: 0, fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-mono-label)',
        letterSpacing: 'var(--ad-track-mono)', textTransform: 'uppercase',
        color: onInk ? 'var(--ad-on-shell-label)' : 'var(--ad-wine)',
      }}>{eyebrow}</p>}
      {title && <h3 style={{
        margin: 0, fontSize: 'var(--ad-size-card)', fontWeight: 900,
        letterSpacing: 'var(--ad-track-section)', textTransform: 'uppercase',
      }}>{title}</h3>}
      {children && <div style={{
        fontSize: 'var(--ad-size-body)', lineHeight: 'var(--ad-leading-body)',
        color: onInk ? 'rgba(247,244,239,.78)' : 'var(--ad-text-muted)',
      }}>{children}</div>}
    </div>
  );
}
