import React from 'react';

/** Bloco `agenda` · puxa os eventos publicados. Passou a data, o item some sozinho. */
export function AgendaBlock({ events = [], sample = false, style, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }} {...rest}>
      {events.map((e, i) => (
        <a key={i} href={e.href || '#'} style={{
          display: 'flex', alignItems: 'baseline', gap: 16, padding: '14px 0', textDecoration: 'none',
          color: 'var(--sl-ink)', borderTop: '1px solid var(--sl-line-hairline)',
          borderBottom: i === events.length - 1 ? '1px solid var(--sl-line-hairline)' : 'none', flexWrap: 'wrap',
        }}>
          <span style={{ flex: 'none', width: 130, fontFamily: 'var(--sl-font-display)', fontSize: 18, color: sample ? 'rgba(11,11,11,.45)' : 'var(--sl-ink)' }}>{e.when}</span>
          <span style={{ flex: 1, minWidth: 180, fontFamily: 'var(--sl-font-body)', fontSize: 'var(--sl-size-body)' }}>{e.title}</span>
          <span style={{ fontSize: 13, color: 'var(--sl-text-muted)' }}>{e.place}</span>
        </a>
      ))}
      {sample && <p style={{ margin: '10px 0 0', fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-data-sm)', color: 'var(--ad-text-quiet)' }}>modo amostra · a lista vem dos eventos publicados</p>}
    </div>
  );
}
