import React from 'react';

/** Mesa · botão. `primary` vinho e `secondary` folha têm 44px; `tool` tem 36px e vive na barra de ferramentas. */
export function DeskButton({ variant = 'secondary', active = false, disabled = false, children, style, ...rest }) {
  const tool = variant === 'tool' || variant === 'toolAccent';
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'var(--ad-font-body)', border: 0, borderRadius: 'var(--ad-radius)',
    cursor: disabled ? 'default' : 'pointer', transition: 'var(--ad-transition)',
    opacity: disabled ? 0.45 : 1, whiteSpace: 'nowrap',
    height: tool ? 'var(--ad-h-tool)' : 'var(--ad-h-control)',
  };
  const skins = {
    primary:   { padding: '0 18px', background: 'var(--ad-wine)', color: 'var(--ad-on-shell)', fontSize: 12, fontWeight: 900, letterSpacing: 'var(--ad-track-button)', textTransform: 'uppercase' },
    secondary: { padding: '0 16px', background: 'var(--ad-sheet)', color: 'var(--ad-text)', border: '1px solid var(--ad-line-strong)', fontSize: 12, fontWeight: 900, letterSpacing: 'var(--ad-track-button)', textTransform: 'uppercase' },
    ink:       { padding: '0 18px', background: 'var(--ad-ink)', color: 'var(--ad-on-shell)', fontSize: 12, fontWeight: 900, letterSpacing: 'var(--ad-track-button)', textTransform: 'uppercase' },
    tool:      { padding: '0 12px', fontSize: 'var(--ad-size-support)',
                 background: active ? 'var(--ad-ink)' : 'var(--ad-sheet)', color: active ? 'var(--ad-on-shell)' : 'var(--ad-text)',
                 border: active ? '1px solid var(--ad-ink)' : '1px solid var(--ad-line-tool)', fontWeight: active ? 900 : 400 },
    toolAccent:{ padding: '0 12px', background: 'var(--ad-wine)', color: 'var(--ad-on-shell)', fontSize: 12, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' },
  };
  return <button type="button" disabled={disabled} style={{ ...base, ...skins[variant], ...style }} {...rest}>{children}</button>;
}
