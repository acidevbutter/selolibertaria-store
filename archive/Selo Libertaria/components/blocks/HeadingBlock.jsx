import React from 'react';

/** Bloco `heading` · H2 e H3 da página. O H1 é o nome da página e não se mexe. */
export function HeadingBlock({ level = 2, children, style, ...rest }) {
  const Tag = level === 3 ? 'h3' : 'h2';
  return (
    <Tag style={{
      margin: 0, fontFamily: 'var(--sl-font-head)', color: 'var(--sl-ink)',
      fontSize: level === 3 ? 24 : 40, lineHeight: level === 3 ? 1.05 : .98,
      fontWeight: 900, letterSpacing: '-.04em', textTransform: 'uppercase', textWrap: 'pretty', ...style,
    }} {...rest}>{children}</Tag>
  );
}
