import React from 'react';

/** Mesa · linha de lista de 48px. O item do painel: título, dado em mono, estado e seta de entrada. */
export function DeskRow({ title, data, badge, trailing, selected = false, hovered = false, last = false, as = 'div', style, ...rest }) {
  const Tag = as;
  return (
    <Tag style={{
      height: 'var(--ad-h-row)', display: 'flex', alignItems: 'center', gap: 14,
      padding: 'var(--ad-pad-row)', textDecoration: 'none', fontFamily: 'var(--ad-font-body)',
      background: selected ? 'var(--ad-ink)' : hovered ? 'var(--ad-row-hover)' : 'transparent',
      color: selected ? 'var(--ad-on-shell)' : 'var(--ad-text)',
      borderBottom: last ? 'none' : '1px solid ' + (hovered ? 'var(--ad-line)' : 'var(--ad-line-quiet)'),
      transition: 'var(--ad-transition)', ...style,
    }} {...rest}>
      <span style={{ fontSize: 'var(--ad-size-body)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
      {badge}
      {data && <span style={{
        marginLeft: 'auto', fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-data)',
        fontVariantNumeric: 'tabular-nums', color: selected ? 'rgba(247,244,239,.65)' : 'var(--ad-text-quiet)',
      }}>{data}</span>}
      {trailing}
    </Tag>
  );
}
