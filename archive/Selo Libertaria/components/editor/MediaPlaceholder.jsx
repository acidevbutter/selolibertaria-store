import React from 'react';

/** Editor · quadro de imagem ausente. Hachura bege com nome de arquivo em mono — nunca placeholder cinza. */
export function MediaPlaceholder({ caption, ratio = '4 / 3', height, style, ...rest }) {
  return (
    <div style={{
      aspectRatio: height ? undefined : ratio, height, width: '100%',
      background: 'repeating-linear-gradient(135deg,#D8D0C4 0 8px,#E4DED4 8px 16px)',
      display: 'flex', alignItems: 'flex-end', padding: 10, boxSizing: 'border-box', ...style,
    }} {...rest}>
      {caption && <span style={{
        fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-micro)', color: 'rgba(11,11,11,.6)',
        background: 'var(--ad-paper)', padding: '3px 6px',
      }}>{caption}</span>}
    </div>
  );
}
