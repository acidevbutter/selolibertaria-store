import React from 'react';

export function InstallmentList({ options = [], selectedIndex = 0, note, style, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-3)', ...style }} {...rest}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {options.map((o, i) => {
          const on = i === selectedIndex;
          return (
            <div key={i} style={{
              height: on ? 'var(--sl-h-field)' : 'var(--sl-h-button)',
              border: on ? '1px solid var(--sl-ink)' : '1px solid rgba(11,11,11,.2)',
              borderTop: i === 0 ? undefined : 'none',
              background: 'var(--sl-surface-card)', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: 'var(--sl-pad-field)',
              fontSize: on ? 'var(--sl-size-body)' : 'var(--sl-size-body-sm)',
              color: on ? 'var(--sl-text)' : 'var(--sl-text-muted)', cursor: 'pointer',
            }}>
              <span>{on ? <><strong>{o.times}</strong> de {o.value}</> : `${o.times} de ${o.value}`}</span>
              <span style={{ fontSize: 'var(--sl-size-meta-sm)', color: o.highlight ? 'var(--sl-accent)' : 'inherit' }}>{o.note}</span>
            </div>
          );
        })}
      </div>
      {note && <p style={{ margin: 0, fontSize: 'var(--sl-size-micro)', color: 'var(--sl-text-soft)' }}>{note}</p>}
    </div>
  );
}
