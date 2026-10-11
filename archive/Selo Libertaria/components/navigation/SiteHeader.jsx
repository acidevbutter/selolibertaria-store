import React from 'react';

export function SiteHeader({
  logo, items = [], active, cartCount = 0, search = 'Buscar na loja',
  variant = 'desktop', style, ...rest
}) {
  if (variant === 'mobile') {
    return (
      <header style={{
        background: 'var(--sl-surface-invert)', color: 'var(--sl-text-on-ink)',
        height: 'var(--sl-h-header-mobile)', padding: '0 var(--sl-gutter-mobile)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...style,
      }} {...rest}>
        <span style={{ fontSize: 'var(--sl-size-meta-sm)', fontWeight: 'var(--sl-weight-label)',
          letterSpacing: 'var(--sl-track-label-wide)', textTransform: 'uppercase' }}>Libertária</span>
        <div style={{ display: 'flex', gap: 'var(--sl-space-3)' }}>
          <span style={{ width: 44, height: 44, border: '1px solid var(--sl-line-on-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>⌕</span>
          <span style={{ minWidth: 44, height: 44, background: 'var(--sl-wine)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>{cartCount}</span>
        </div>
      </header>
    );
  }
  return (
    <header style={{
      background: 'var(--sl-surface-invert)', color: 'var(--sl-text-on-ink)',
      padding: '0 var(--sl-gutter-desktop)', height: 'var(--sl-h-header)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...style,
    }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sl-space-6)' }}>
        <div style={{ width: 40, height: 40, overflow: 'hidden', flex: 'none' }}>{logo}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 'var(--sl-size-label-sm)', fontWeight: 'var(--sl-weight-label)',
            letterSpacing: 'var(--sl-track-label-widest)', textTransform: 'uppercase', color: 'var(--sl-text-on-ink-label)' }}>Selo</span>
          <span style={{ fontSize: 'var(--sl-size-body-sm)', fontWeight: 'var(--sl-weight-label)',
            letterSpacing: 'var(--sl-track-label-wide)', textTransform: 'uppercase' }}>Libertária</span>
        </div>
      </div>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--sl-space-10)',
        fontSize: 'var(--sl-size-micro)', fontWeight: 'var(--sl-weight-strong)',
        letterSpacing: 'var(--sl-track-label-tight)', textTransform: 'uppercase' }}>
        {items.map((it) => (
          <span key={it} style={{
            display: 'inline-flex', alignItems: 'center', height: 'var(--sl-h-small)',
            borderBottom: it === active ? '2px solid var(--sl-buy)' : '2px solid transparent',
            color: it === active ? 'var(--sl-text-on-ink)' : 'var(--sl-text-on-ink-soft)', cursor: 'pointer',
          }}>{it}</span>
        ))}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sl-space-4)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', height: 'var(--sl-h-small)',
          padding: '0 14px', border: '1px solid var(--sl-line-on-ink)', fontSize: 'var(--sl-size-meta-sm)',
          color: 'var(--sl-text-on-ink-soft)', minWidth: 200 }}>{search}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sl-space-3)',
          height: 'var(--sl-h-small)', padding: '0 14px', background: 'var(--sl-wine)',
          fontSize: 'var(--sl-size-label)', fontWeight: 'var(--sl-weight-label)',
          letterSpacing: '.22em', textTransform: 'uppercase' }}>
          Carrinho
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 20, height: 20, background: 'var(--sl-paper)', color: 'var(--sl-wine)', fontSize: 11 }}>{cartCount}</span>
        </span>
      </div>
    </header>
  );
}
