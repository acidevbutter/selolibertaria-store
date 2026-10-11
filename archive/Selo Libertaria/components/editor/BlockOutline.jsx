import React from 'react';

/** Editor · lista de blocos da página. Folha de 230px à direita, linha de 40px, índice em mono, selecionado em vinho. */
export function BlockOutline({ blocks = [], current, onSelect, note = 'Arraste na lista para reordenar sem rolar a página.', style, ...rest }) {
  return (
    <div style={{
      flex: 'none', width: 'var(--ad-w-outline)', background: 'var(--ad-sheet)', border: '1px solid var(--ad-line)',
      display: 'flex', flexDirection: 'column', fontFamily: 'var(--ad-font-body)', ...style,
    }} {...rest}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--ad-line)', fontSize: 'var(--ad-size-micro)', fontWeight: 900, letterSpacing: 'var(--ad-track-label)', textTransform: 'uppercase', color: 'var(--ad-text-label)' }}>Blocos da página</div>
      {blocks.map((b, i) => {
        const sel = (b.id ?? i) === current;
        return (
          <div key={b.id ?? i} onClick={onSelect ? () => onSelect(b.id ?? i) : undefined} style={{
            height: 'var(--ad-h-outline)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
            background: sel ? 'var(--ad-wine)' : 'transparent', color: sel ? 'var(--ad-on-shell)' : 'var(--ad-text)',
            borderBottom: i === blocks.length - 1 ? 'none' : '1px solid var(--ad-line-quiet)',
            cursor: onSelect ? 'pointer' : 'default', transition: 'var(--ad-transition)',
          }}>
            <span style={{ fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-micro)', color: sel ? 'rgba(247,244,239,.65)' : 'var(--ad-text-faint)' }}>{String(i + 1).padStart(2, '0')}</span>
            <span style={{ fontSize: 14 }}>{b.label}</span>
          </div>
        );
      })}
      {note && <div style={{ marginTop: 'auto', padding: '12px 14px', background: 'var(--ad-sand)', fontSize: 12, lineHeight: 'var(--ad-leading-body)', color: 'var(--ad-text-soft)' }}>{note}</div>}
    </div>
  );
}
