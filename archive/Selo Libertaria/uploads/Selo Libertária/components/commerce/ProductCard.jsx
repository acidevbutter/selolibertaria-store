import React from 'react';
import { Button } from '../actions/Button.jsx';
import { Chip } from '../actions/Chip.jsx';

export function ProductCard({
  image, category, badge, badgeTone = 'ink', title, blurb, price, note,
  action = 'Adicionar', soldOut = false, compact = false, style, ...rest
}) {
  return (
    <article style={{
      display: 'flex', flexDirection: 'column', background: 'var(--sl-surface-card)',
      border: '1px solid var(--sl-line-hairline)', borderRadius: 'var(--sl-radius)', ...style,
    }} {...rest}>
      <div style={{ aspectRatio: 'var(--sl-image-ratio)', background: 'var(--sl-sand)', overflow: 'hidden', position: 'relative' }}>
        {image}
        {badge && (
          <Chip tone={badgeTone} size="badge" style={{ position: 'absolute', top: 0, left: 0 }}>{badge}</Chip>
        )}
      </div>
      <div style={{
        padding: compact ? 'var(--sl-space-5)' : 'var(--sl-pad-card)',
        display: 'flex', flexDirection: 'column', gap: compact ? 'var(--sl-space-3)' : 'var(--sl-space-4)', flex: 1,
      }}>
        {category && (
          <span style={{ fontSize: 'var(--sl-size-label-sm)', fontWeight: 'var(--sl-weight-label)',
            letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--sl-text-quiet)' }}>{category}</span>
        )}
        <h3 style={{
          margin: 0, fontFamily: 'var(--sl-font-display)',
          fontSize: compact ? 'var(--sl-size-card-title-sm)' : 'var(--sl-size-card-title)',
          fontWeight: 'var(--sl-weight-strong)', letterSpacing: 'var(--sl-track-card)',
          flex: compact ? 1 : undefined,
        }}>{title}</h3>
        {blurb && (
          <p style={{ margin: 0, flex: 1, fontSize: 'var(--sl-size-meta-sm)',
            lineHeight: 1.65, color: 'var(--sl-text-muted)' }}>{blurb}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--sl-space-3)' }}>
          <span style={{ fontFamily: 'var(--sl-font-display)', fontSize: compact ? 'var(--sl-size-card-title-sm)' : 'var(--sl-size-card-title)',
            color: soldOut ? 'var(--sl-text-soft)' : 'var(--sl-text)' }}>{price}</span>
          {note && (
            <span style={{ fontSize: 'var(--sl-size-label)', letterSpacing: '.14em', textTransform: 'uppercase',
              color: soldOut ? 'var(--sl-text-soft)' : 'var(--sl-accent)' }}>{note}</span>
          )}
        </div>
        <Button variant={soldOut ? 'secondary' : 'primary'} size={compact ? 'sm' : 'md'} full>{action}</Button>
      </div>
    </article>
  );
}
