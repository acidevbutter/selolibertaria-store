import React from 'react';

export function CheckoutStepper({ steps = [], current = 1, on = 'ink', style, ...rest }) {
  const onInk = on === 'ink';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sl-space-4)',
      fontSize: onInk ? 'var(--sl-size-label)' : 'var(--sl-size-label-sm)',
      fontWeight: 'var(--sl-weight-label)', letterSpacing: '.22em', textTransform: 'uppercase', ...style }} {...rest}>
      {steps.map((s, i) => {
        const n = i + 1;
        const active = n === current;
        return (
          <React.Fragment key={s}>
            {i > 0 && <span style={{ flex: 'none', width: onInk ? 24 : 14, height: 1, background: onInk ? 'var(--sl-line-on-ink-mid)' : 'rgba(11,11,11,.4)' }} />}
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              height: active ? 28 : undefined, padding: active ? '0 10px' : 0,
              background: active ? (onInk ? 'var(--sl-buy)' : 'var(--sl-ink)') : 'transparent',
              color: active ? 'var(--sl-text-on-ink)' : (onInk ? 'var(--sl-text-on-ink)' : 'var(--sl-text-soft)'),
            }}>{n} · {s}{!active && n < current ? ' ✓' : ''}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
