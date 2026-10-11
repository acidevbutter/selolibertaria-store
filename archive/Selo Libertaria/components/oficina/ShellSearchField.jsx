import React from 'react';

/** Casca · busca global dentro da topbar. 34px sobre a superfície elevada, com atalho à direita. */
export function ShellSearchField({ placeholder = 'Buscar em todo o painel', shortcut = '⌘K', value, onChange, onFocus, focused = false, style, ...rest }) {
  return (
    <div style={{
      flex: 1, maxWidth: 'var(--ad-w-search)', height: 'var(--ad-h-search)', background: 'var(--ad-shell-2)',
      border: '1px solid ' + (focused ? 'var(--ad-on-shell)' : 'var(--ad-shell-line)'),
      display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
      transition: 'var(--ad-transition)', ...style,
    }} {...rest}>
      <span aria-hidden="true" style={{ fontSize: 15, color: 'var(--ad-on-shell-label)' }}>⌕</span>
      <input
        value={value} onChange={onChange} onFocus={onFocus} placeholder={placeholder}
        style={{
          flex: 1, minWidth: 0, height: '100%', border: 0, outline: 'none', background: 'transparent',
          fontFamily: 'var(--ad-font-body)', fontSize: 'var(--ad-size-support)', color: 'var(--ad-on-shell)',
        }}
      />
      {shortcut && <span style={{ fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-micro)', color: 'rgba(247,244,239,.6)' }}>{shortcut}</span>}
    </div>
  );
}
