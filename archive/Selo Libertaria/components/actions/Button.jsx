import React from 'react';

const HEIGHT = { buy: 'var(--sl-h-buy)', md: 'var(--sl-h-button)', sm: 'var(--sl-h-small)' };
const FONT = { buy: '13px', md: '11px', sm: '11px' };

export function Button({
  variant = 'primary', size = 'md', on = 'paper', full = false,
  disabled = false, as = 'button', children, style, ...rest
}) {
  const onInk = on === 'ink';
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    height: HEIGHT[size], padding: size === 'buy' ? 'var(--sl-pad-buy)' : 'var(--sl-pad-button)',
    borderRadius: 'var(--sl-radius)', border: '1px solid transparent',
    fontFamily: 'var(--sl-font-body)', fontSize: FONT[size],
    fontWeight: 'var(--sl-weight-label)', letterSpacing: 'var(--sl-track-label)',
    textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer',
    width: full ? '100%' : undefined, transition: 'var(--sl-transition)',
    background: 'transparent', color: 'inherit', textDecoration: 'none',
  };
  const skins = {
    buy:       { background: 'var(--sl-buy)', color: 'var(--sl-text-on-ink)' },
    primary:   { background: onInk ? 'var(--sl-paper)' : 'var(--sl-ink)', color: onInk ? 'var(--sl-ink)' : 'var(--sl-text-on-ink)' },
    secondary: { border: `1px solid ${onInk ? 'var(--sl-line-on-ink-hi)' : 'var(--sl-ink)'}`, color: onInk ? 'var(--sl-text-on-ink)' : 'var(--sl-ink)' },
    quiet:     { border: `1px solid ${onInk ? 'var(--sl-line-on-ink)' : 'var(--sl-line-strong)'}`, color: onInk ? 'var(--sl-text-on-ink-soft)' : 'var(--sl-text-muted)' },
  };
  const off = disabled ? { border: '1px solid var(--sl-line-strong)', background: 'transparent', color: 'var(--sl-text-disabled)' } : null;
  const Tag = as;
  return <Tag disabled={as === 'button' ? disabled : undefined} style={{ ...base, ...skins[variant], ...off, ...style }} {...rest}>{children}</Tag>;
}
