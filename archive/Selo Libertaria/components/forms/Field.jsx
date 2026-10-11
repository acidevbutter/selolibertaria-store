import React from 'react';

export function Field({ label, value, placeholder, state = 'default', on = 'paper', hint, suffix, style, ...rest }) {
  const onInk = on === 'ink';
  const empty = value === undefined || value === '';
  const box = {
    default: { border: `1px solid ${onInk ? 'var(--sl-line-on-ink-mid)' : 'var(--sl-line-strong)'}`, background: onInk ? 'transparent' : 'var(--sl-surface-card)' },
    focus:   { border: `1px solid ${onInk ? 'var(--sl-paper)' : 'var(--sl-line-solid)'}`, background: onInk ? 'transparent' : 'var(--sl-surface-card)', boxShadow: 'var(--sl-focus-ring)' },
    error:   { border: '1px solid var(--sl-danger)', background: 'var(--sl-danger-wash)' },
  }[state];
  const text = state === 'error' ? 'var(--sl-danger)'
    : empty ? (onInk ? 'var(--sl-text-on-ink-soft)' : 'var(--sl-text-disabled)')
    : (onInk ? 'var(--sl-text-on-ink)' : 'var(--sl-text)');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-3)', ...style }}>
      {label && (
        <span style={{
          fontSize: 'var(--sl-size-label-sm)', fontWeight: 'var(--sl-weight-label)',
          letterSpacing: 'var(--sl-track-label)', textTransform: 'uppercase',
          color: state === 'error' ? 'var(--sl-danger)' : (onInk ? 'var(--sl-text-on-ink-label)' : 'var(--sl-text-label)'),
        }}>{label}</span>
      )}
      <div style={{
        height: 'var(--sl-h-field)', padding: 'var(--sl-pad-field)', borderRadius: 'var(--sl-radius)',
        display: 'flex', alignItems: 'center', justifyContent: suffix ? 'space-between' : 'flex-start',
        gap: 'var(--sl-space-4)', fontSize: 'var(--sl-size-body)', color: text, ...box,
      }} {...rest}>
        <span>{empty ? placeholder : value}</span>
        {suffix}
      </div>
      {hint && (
        <p style={{ margin: 0, fontSize: 'var(--sl-size-meta-sm)', lineHeight: 'var(--sl-leading-compact)',
          color: state === 'error' ? 'var(--sl-danger)' : 'var(--sl-text-soft)' }}>{hint}</p>
      )}
    </div>
  );
}
