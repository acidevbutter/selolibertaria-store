import React from 'react';
import { Button } from '../actions/Button.jsx';

export function SiteFooter({ blurb, columns = [], style, ...rest }) {
  return (
    <footer style={{
      background: 'var(--sl-surface-page)', padding: '40px var(--sl-gutter-desktop)',
      display: 'flex', flexWrap: 'wrap', gap: 'var(--sl-space-13)', justifyContent: 'space-between',
      borderTop: '1px solid var(--sl-line-hairline)', ...style,
    }} {...rest}>
      <div style={{ maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-5)' }}>
        <p style={{ margin: 0, fontSize: 'var(--sl-size-label)', fontWeight: 'var(--sl-weight-label)',
          letterSpacing: 'var(--sl-track-label-wide)', textTransform: 'uppercase', color: 'var(--sl-text-quiet)' }}>Selo Libertária</p>
        <p style={{ margin: 0, fontSize: 'var(--sl-size-meta)', lineHeight: 'var(--sl-leading-body)', color: 'var(--sl-text-muted)' }}>{blurb}</p>
        <div style={{ display: 'flex', gap: 'var(--sl-space-3)' }}>
          <span style={{ flex: 1, height: 'var(--sl-h-field)', border: '1px solid var(--sl-line-strong)',
            display: 'flex', alignItems: 'center', padding: 'var(--sl-pad-field)',
            fontSize: 'var(--sl-size-meta)', color: 'var(--sl-text-disabled)' }}>seu e-mail</span>
          <Button variant="primary" style={{ height: 'var(--sl-h-field)', padding: '0 18px' }}>Assinar</Button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, auto)`, gap: 'var(--sl-space-14)', fontSize: 'var(--sl-size-meta-sm)' }}>
        {columns.map((col) => (
          <div key={col.title}>
            <p style={{ margin: '0 0 12px', fontSize: 'var(--sl-size-label)', fontWeight: 'var(--sl-weight-label)',
              letterSpacing: 'var(--sl-track-label)', textTransform: 'uppercase', color: 'var(--sl-text-quiet)' }}>{col.title}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-3)', color: 'rgba(11,11,11,.75)' }}>
              {col.links.map((l) => <span key={l}>{l}</span>)}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
