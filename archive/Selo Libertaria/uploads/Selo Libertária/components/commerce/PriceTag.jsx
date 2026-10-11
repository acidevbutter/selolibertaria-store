import React from 'react';

const SIZES = { xl: '44px', lg: '40px', md: '28px', sm: '22px', xs: '18px' };

export function PriceTag({ value, size = 'md', aside, muted = false, style, ...rest }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sl-space-5)', ...style }} {...rest}>
      <span style={{ fontFamily: 'var(--sl-font-display)', fontSize: SIZES[size],
        letterSpacing: '-.03em', color: muted ? 'var(--sl-text-soft)' : 'inherit' }}>{value}</span>
      {aside && <span style={{ fontSize: 'var(--sl-size-meta)', color: 'var(--sl-text-soft)' }}>{aside}</span>}
    </div>
  );
}
