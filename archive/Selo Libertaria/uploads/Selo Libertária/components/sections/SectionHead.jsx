import React from 'react';

export function SectionHead({ title, action, on = 'paper', size = 'lg', style, ...rest }) {
  const onInk = on === 'ink';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      gap: 'var(--sl-space-9)', paddingBottom: 'var(--sl-space-8)',
      borderBottom: `1px solid ${onInk ? 'var(--sl-line-on-ink)' : 'var(--sl-line-hairline)'}`, ...style,
    }} {...rest}>
      <h2 style={{
        margin: 0, fontFamily: 'var(--sl-font-head)',
        fontSize: size === 'lg' ? 'var(--sl-size-section)' : 'var(--sl-size-section-sm)',
        fontWeight: 'var(--sl-weight-head)', letterSpacing: 'var(--sl-track-head)',
        textTransform: 'uppercase', color: onInk ? 'var(--sl-text-on-ink)' : 'var(--sl-text)',
      }}>{title}</h2>
      {action}
    </div>
  );
}
