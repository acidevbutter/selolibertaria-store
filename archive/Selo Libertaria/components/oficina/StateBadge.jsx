import React from 'react';

const TONES = {
  publicado:  { background: 'var(--ad-sand)', color: 'var(--ad-wine)' },
  rascunho:   { border: '1px solid var(--ad-line-strong)', color: 'var(--ad-text-soft)' },
  emCurso:    { background: 'var(--ad-ink)', color: 'var(--ad-on-shell)' },
  falha:      { background: 'var(--ad-wine-wash-solid)', border: '1px solid var(--ad-wine-line)', color: 'var(--ad-wine)' },
  naCasca:    { background: 'var(--ad-paper)', color: 'var(--ad-ink)' },
};

/** Badge de estado · 24px, mono 11. Quatro tons na paleta do selo — nada de verde ou âmbar de biblioteca. */
export function StateBadge({ tone = 'rascunho', children, style, ...rest }) {
  return (
    <span style={{
      height: 'var(--ad-h-badge)', display: 'inline-flex', alignItems: 'center', padding: '0 10px',
      fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-micro)',
      letterSpacing: 'var(--ad-track-badge)', textTransform: 'uppercase', whiteSpace: 'nowrap',
      ...TONES[tone], ...style,
    }} {...rest}>{children}</span>
  );
}
