import React from 'react';

export function PageHero({ eyebrow, title, lead, size = 'md', actions, aside, children, style, ...rest }) {
  const titleSize = { xl: 'var(--sl-size-hero-xl)', md: 'var(--sl-size-hero-md)', sm: 'var(--sl-size-hero-sm)' }[size];
  return (
    <section style={{
      background: 'var(--sl-surface-invert)', color: 'var(--sl-text-on-ink)',
      padding: '56px var(--sl-gutter-desktop) 64px',
      display: 'grid', gridTemplateColumns: aside ? '1fr 520px' : '1fr',
      gap: 'var(--sl-space-15)', alignItems: 'center', ...style,
    }} {...rest}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-9)' }}>
        {eyebrow && (
          <p style={{ margin: 0, fontSize: 'var(--sl-size-label)', fontWeight: 'var(--sl-weight-label)',
            letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--sl-text-on-ink-label)' }}>{eyebrow}</p>
        )}
        <h1 style={{
          margin: 0, fontFamily: 'var(--sl-font-head)', fontSize: titleSize,
          lineHeight: 'var(--sl-leading-hero)', fontWeight: 'var(--sl-weight-head)',
          letterSpacing: 'var(--sl-track-hero)', textTransform: 'uppercase',
          maxWidth: 'var(--sl-measure-head)',
        }}>{title}</h1>
        {lead && (
          <p style={{ margin: 0, maxWidth: 'var(--sl-measure-lead)', fontSize: 'var(--sl-size-lead)',
            lineHeight: 'var(--sl-leading-body)', color: 'var(--sl-text-on-ink-muted)' }}>{lead}</p>
        )}
        {children}
        {actions && <div style={{ display: 'flex', gap: 'var(--sl-space-5)' }}>{actions}</div>}
      </div>
      {aside && <div style={{ aspectRatio: 'var(--sl-image-ratio)', background: 'var(--sl-charcoal)', overflow: 'hidden' }}>{aside}</div>}
    </section>
  );
}
