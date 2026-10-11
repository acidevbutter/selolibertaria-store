import React from 'react';

/** Número do painel. Valor SEMPRE em DCC Ash — nunca em Fertigo. */
export function MetricCard({ label, value, tone = 'default', action, href, onClick, style, ...rest }) {
  const clickable = Boolean(href || onClick);
  const Tag = href ? 'a' : clickable ? 'button' : 'div';
  return (
    <Tag href={href} onClick={onClick} style={{
      display: 'block', textAlign: 'left', width: '100%', font: 'inherit',
      background: 'var(--sl-surface-card)', color: 'var(--sl-text)',
      border: `1px solid ${clickable ? 'var(--sl-line)' : 'var(--sl-line-hairline)'}`,
      borderRadius: 'var(--sl-radius)', padding: 'var(--sl-pad-metric)',
      textDecoration: 'none', cursor: clickable ? 'pointer' : 'default',
      transition: 'var(--sl-transition)', ...style,
    }} {...rest}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 'var(--sl-size-label)', fontWeight: 'var(--sl-weight-label)', letterSpacing: 'var(--sl-track-label-tight)', textTransform: 'uppercase', color: 'var(--sl-accent)' }}>{label}</span>
        {clickable ? <span style={{ fontSize: 'var(--sl-size-label)', fontWeight: 'var(--sl-weight-label)', letterSpacing: 'var(--sl-track-label-tight)', textTransform: 'uppercase', color: 'var(--sl-text-label)' }}>{action || 'Ver'} →</span> : null}
      </span>
      <span style={{
        display: 'block', marginTop: 16,
        fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-size-display-metric, 30px)',
        letterSpacing: 'var(--sl-track-card)',
        color: tone === 'danger' ? 'var(--sl-danger)' : 'var(--sl-text)',
      }}>{value}</span>
    </Tag>
  );
}
