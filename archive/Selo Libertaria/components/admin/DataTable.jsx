import React from 'react';

/**
 * Tabela única da área logada — consumida por pedidos, produtos e usuários.
 * Filete em tinta transparente (20% no cabeçalho, 14% nas linhas). Nenhum cinza de biblioteca.
 */
export function DataTable({ columns = [], rows = [], empty, zebra = true, style, ...rest }) {
  const grid = columns.map((c) => c.width || 'minmax(0,1fr)').join(' ');
  return (
    <div style={{
      background: 'var(--sl-surface-card)', color: 'var(--sl-text)',
      border: '1px solid var(--sl-line-hairline)', borderRadius: 'var(--sl-radius)', ...style,
    }} {...rest}>
      <div style={{
        display: 'grid', gridTemplateColumns: grid, gap: 16, padding: 'var(--sl-pad-table-head)',
        fontSize: 'var(--sl-size-label-sm)', fontWeight: 'var(--sl-weight-label)',
        letterSpacing: 'var(--sl-track-label-tight)', textTransform: 'uppercase',
        color: 'var(--sl-text-label)', borderBottom: '1px solid var(--sl-line)',
      }}>
        {columns.map((c) => <span key={c.key}>{c.label}</span>)}
      </div>

      {rows.length === 0 ? (
        <div style={{ background: 'var(--sl-surface-band)', padding: '24px 20px', fontSize: 'var(--sl-size-meta)', lineHeight: 'var(--sl-leading-compact)', color: 'var(--sl-text-muted)' }}>
          {empty || 'Nenhum resultado para este período. Troque o filtro ou veja todos os registros.'}
        </div>
      ) : rows.map((row, i) => (
        <div key={row.id || i} style={{
          display: 'grid', gridTemplateColumns: grid, gap: 16, alignItems: 'center',
          padding: 'var(--sl-pad-table-cell)', fontSize: 'var(--sl-size-body-sm)',
          background: zebra && i % 2 === 1 ? 'var(--sl-surface-row-hover)' : 'transparent',
          borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--sl-line-hairline)',
          transition: 'var(--sl-transition)',
        }}>
          {columns.map((c) => (
            <span key={c.key} style={c.numeric ? { fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-size-card-title-sm)' } : undefined}>
              {typeof c.render === 'function' ? c.render(row) : row[c.key]}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
