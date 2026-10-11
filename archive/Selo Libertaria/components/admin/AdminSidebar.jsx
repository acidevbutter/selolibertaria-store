import React from 'react';

/** Barra do painel: preto, 264px, canto reto. O item selecionado é bloco sólido vinho. */
export function AdminSidebar({ items = [], selectedId, brand = 'Libertária', subtitle = 'Painel editorial', logoSrc, session, onSelect, style, ...rest }) {
  return (
    <nav style={{
      width: 'var(--sl-w-sidebar)', flex: 'none', display: 'flex', flexDirection: 'column',
      background: 'var(--sl-surface-invert)', color: 'var(--sl-text-on-ink)',
      padding: '28px 0', borderRadius: 'var(--sl-radius)', ...style,
    }} {...rest}>
      <div style={{ padding: '0 28px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {logoSrc ? (
          <span style={{ width: 44, height: 44, background: 'var(--sl-paper)', padding: 6, boxSizing: 'border-box', display: 'block' }}>
            <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </span>
        ) : null}
        <span style={{ display: 'block' }}>
          <span style={{ display: 'block', fontSize: 'var(--sl-size-meta-sm)', fontWeight: 'var(--sl-weight-label)', letterSpacing: 'var(--sl-track-label)', textTransform: 'uppercase' }}>{brand}</span>
          <span style={{ display: 'block', marginTop: 4, fontSize: 'var(--sl-size-label-sm)', fontWeight: 'var(--sl-weight-label)', letterSpacing: 'var(--sl-track-label)', textTransform: 'uppercase', color: 'var(--sl-text-on-ink-quiet)' }}>{subtitle}</span>
        </span>
      </div>

      <div style={{ padding: '14px 0 0', display: 'flex', flexDirection: 'column' }}>
        {items.map((item) => {
          const selected = item.id === selectedId;
          return (
            <a key={item.id} href={item.href || '#'} aria-current={selected ? 'page' : undefined}
              onClick={onSelect ? (e) => { e.preventDefault(); onSelect(item.id); } : undefined}
              style={{
                display: 'flex', alignItems: 'center', height: 'var(--sl-h-nav-item)',
                padding: 'var(--sl-pad-nav-item)', textDecoration: 'none',
                borderRadius: 'var(--sl-radius)', transition: 'var(--sl-transition)',
                background: selected ? 'var(--sl-nav-selected)' : 'transparent',
                color: selected ? 'var(--sl-text-on-ink)' : 'var(--sl-text-on-ink-soft)',
                fontSize: 'var(--sl-size-body-sm)',
                fontWeight: selected ? 'var(--sl-weight-label)' : 400,
                letterSpacing: selected ? '.04em' : 'normal',
                textTransform: selected ? 'uppercase' : 'none',
              }}>{item.label}</a>
          );
        })}
      </div>

      {session ? (
        <div style={{ marginTop: 'auto', padding: '24px 28px 0' }}>
          <span style={{ display: 'block', height: 1, background: 'var(--sl-line-on-ink)', marginBottom: 20 }} />
          <span style={{ display: 'block', fontSize: 'var(--sl-size-label-sm)', fontWeight: 'var(--sl-weight-label)', letterSpacing: 'var(--sl-track-label)', textTransform: 'uppercase', color: 'var(--sl-text-on-ink-quiet)' }}>Sessão</span>
          <span style={{ display: 'block', marginTop: 10, fontSize: 'var(--sl-size-body-sm)' }}>{session.name}</span>
          <span style={{ display: 'block', marginTop: 4, fontSize: 'var(--sl-size-meta-sm)', color: 'var(--sl-text-on-ink-soft)' }}>{session.email}</span>
        </div>
      ) : null}
    </nav>
  );
}
