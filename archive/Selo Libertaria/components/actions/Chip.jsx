import React from 'react';

export function Chip({ tone = 'outline', on = 'paper', size = 'chip', children, style, ...rest }) {
  const onInk = on === 'ink';
  const tones = {
    solid:   { background: 'var(--sl-wine)', color: 'var(--sl-text-on-ink)' },
    ink:     { background: 'var(--sl-ink)', color: 'var(--sl-text-on-ink)' },
    buy:     { background: 'var(--sl-buy)', color: 'var(--sl-text-on-ink)' },
    sand:    { background: 'var(--sl-sand)', color: 'var(--sl-ink)' },
    paper:   { background: 'var(--sl-paper)', color: 'var(--sl-ink)', border: '1px solid var(--sl-ink)' },
    danger:  { background: 'var(--sl-danger-wash)', color: 'var(--sl-danger)', border: '1px solid var(--sl-danger-line)' },
    quiet:   { background: 'var(--sl-surface-quiet)', color: 'var(--sl-text-muted)' },
    outline: { border: `1px solid ${onInk ? 'var(--sl-line-on-ink-mid)' : 'var(--sl-line-strong)'}`, color: onInk ? 'var(--sl-text-on-ink-muted)' : 'var(--sl-text-muted)' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      height: size === 'badge' ? 'var(--sl-h-badge)' : 'var(--sl-h-chip)',
      padding: size === 'badge' ? '0 9px' : 'var(--sl-pad-chip)',
      fontSize: 'var(--sl-size-label-sm)', fontWeight: 'var(--sl-weight-label)',
      letterSpacing: 'var(--sl-track-label-tight)', textTransform: 'uppercase',
      borderRadius: 'var(--sl-radius)', ...tones[tone], ...style,
    }} {...rest}>{children}</span>
  );
}
