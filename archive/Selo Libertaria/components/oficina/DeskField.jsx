import React from 'react';

/** Mesa · campo de 44px sobre folha. Rótulo em micro-label, apoio embaixo, erro em vinho com saída. */
export function DeskField({ label, hint, error, mono = false, focused = false, as = 'input', style, wrapStyle, ...rest }) {
  const Tag = as;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--ad-font-body)', ...wrapStyle }}>
      {label && <span style={{ fontSize: 'var(--ad-size-micro)', fontWeight: 900, letterSpacing: 'var(--ad-track-label)', textTransform: 'uppercase', color: 'var(--ad-text-label)' }}>{label}</span>}
      <Tag style={{
        height: as === 'textarea' ? undefined : 'var(--ad-h-control)',
        minHeight: as === 'textarea' ? 96 : undefined,
        width: '100%', boxSizing: 'border-box', background: 'var(--ad-sheet)', color: 'var(--ad-text)',
        border: '1px solid ' + (error ? 'var(--ad-wine-line)' : focused ? 'var(--ad-ink)' : 'var(--ad-line-strong)'),
        boxShadow: focused ? 'var(--ad-focus)' : 'none', outline: 'none', padding: as === 'textarea' ? '12px 14px' : '0 14px',
        fontFamily: mono ? 'var(--ad-font-mono)' : 'var(--ad-font-body)',
        fontSize: mono ? 'var(--ad-size-data)' : 'var(--ad-size-body)',
        borderRadius: 'var(--ad-radius)', transition: 'var(--ad-transition)', ...style,
      }} {...rest} />
      {(error || hint) && <span style={{
        fontSize: 12, lineHeight: 1.5, color: error ? 'var(--ad-wine)' : 'var(--ad-text-quiet)',
      }}>{error || hint}</span>}
    </div>
  );
}
