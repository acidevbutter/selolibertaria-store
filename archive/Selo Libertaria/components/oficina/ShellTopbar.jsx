import React from 'react';
import { ShellSearchField } from './ShellSearchField.jsx';

/** Casca · topbar de 56px: busca global, link para o site e conta. Não se mexe quando a mesa carrega. */
export function ShellTopbar({ search = true, searchProps, siteHref = '/', siteLabel = 'Ver o site ↗', initials, children, style, ...rest }) {
  return (
    <header style={{
      height: 'var(--ad-h-topbar)', background: 'var(--ad-shell)', color: 'var(--ad-on-shell)',
      fontFamily: 'var(--ad-font-body)', display: 'flex', alignItems: 'center', gap: 14,
      padding: '0 20px', borderBottom: '1px solid var(--ad-shell-line)', ...style,
    }} {...rest}>
      {search && <ShellSearchField {...searchProps} />}
      {children}
      <a href={siteHref} style={{ marginLeft: 'auto', fontSize: 'var(--ad-size-support)', color: 'rgba(247,244,239,.6)', textDecoration: 'none' }}>{siteLabel}</a>
      {initials && <span style={{
        width: 28, height: 28, background: 'var(--ad-paper)', color: 'var(--ad-ink)', flex: 'none',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-data-sm)',
      }}>{initials}</span>}
    </header>
  );
}
