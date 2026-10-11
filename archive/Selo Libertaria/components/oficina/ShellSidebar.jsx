import React from 'react';

/**
 * Casca · rail de navegação do painel. Componente FECHADO: copiar como está, não redesenhar por tela.
 * Três grupos (Conteúdo · Operação · Sistema), item de 44px, selecionado = bloco sólido vinho.
 */
export function ShellSidebar({ groups = [], current, parent, logo, product = 'Painel editorial', brand = 'Libertária', user, style, ...rest }) {
  return (
    <nav style={{
      flex: 'none', width: 'var(--ad-w-rail)', background: 'var(--ad-shell)', color: 'var(--ad-on-shell)',
      fontFamily: 'var(--ad-font-body)', display: 'flex', flexDirection: 'column', padding: '24px 0',
      borderRadius: 'var(--ad-radius)', ...style,
    }} {...rest}>
      <div style={{ padding: '0 28px 6px', display: 'flex', gap: 14, alignItems: 'center' }}>
        {logo && <div style={{ flex: 'none', width: 44, height: 44, background: 'var(--ad-paper)', padding: 6, boxSizing: 'border-box' }}>
          <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        </div>}
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 'var(--ad-track-mono)', textTransform: 'uppercase' }}>{brand}</div>
          <div style={{ marginTop: 4, fontSize: 10, fontWeight: 900, letterSpacing: 'var(--ad-track-mono)', textTransform: 'uppercase', color: 'var(--ad-on-shell-label)' }}>{product}</div>
        </div>
      </div>

      {groups.map((g, gi) => (
        <React.Fragment key={g.label}>
          <div style={{
            padding: gi === 0 ? '12px 28px 6px' : '18px 28px 6px', fontFamily: 'var(--ad-font-mono)',
            fontSize: 'var(--ad-size-mono-label)', letterSpacing: 'var(--ad-track-label)',
            textTransform: 'uppercase', color: 'var(--ad-on-shell-label)',
          }}>{g.label}</div>
          {g.items.map((it) => {
            const sel = it.id === current;
            const par = it.id === parent;
            return (
              <a key={it.id} href={it.href || '#'} style={{
                height: 'var(--ad-h-control)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--ad-pad-rail)', fontSize: 'var(--ad-size-body)', textDecoration: 'none',
                background: sel ? 'var(--ad-selected)' : par ? 'var(--ad-shell-hover)' : 'transparent',
                color: sel ? 'var(--ad-on-shell)' : par ? 'var(--ad-on-shell)' : 'var(--ad-on-shell-soft)',
                fontWeight: sel ? 900 : 400, letterSpacing: sel ? '.04em' : 0,
                textTransform: sel ? 'uppercase' : 'none', transition: 'var(--ad-transition)',
              }}>
                {it.label}
                {it.count != null && <span style={{
                  fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-micro)', fontWeight: 400, letterSpacing: 0,
                  color: sel ? 'rgba(247,244,239,.65)' : 'var(--ad-on-shell-quiet)',
                }}>{it.count}</span>}
              </a>
            );
          })}
        </React.Fragment>
      ))}

      {user && <div style={{
        marginTop: 'auto', padding: '18px 28px 0', borderTop: '1px solid var(--ad-shell-line)',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <span style={{ fontSize: 'var(--ad-size-support)', color: 'rgba(247,244,239,.85)' }}>{user.name}</span>
        <span style={{ fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-micro)', color: 'var(--ad-on-shell-label)' }}>{user.capability}</span>
      </div>}
    </nav>
  );
}
