import React from 'react';
import { MediaPlaceholder } from '../editor/MediaPlaceholder.jsx';

const RATIO = { wide: '16 / 9', side: '4 / 3', center: '3 / 4', gallery: '1 / 1' };

/** Bloco `image` · quatro formas nomeadas: wide, side, center, gallery. Nunca largura em pixel. */
export function ImageBlock({ src, alt = '', caption, layout = 'wide', flip = false, text, file, style, ...rest }) {
  const frame = src
    ? <img src={src} alt={alt} style={{ width: '100%', display: 'block', aspectRatio: RATIO[layout], objectFit: 'cover', background: 'var(--sl-sand)' }} />
    : <MediaPlaceholder caption={file} ratio={RATIO[layout]} />;
  const cap = caption && <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'rgba(11,11,11,.55)', textAlign: layout === 'center' ? 'center' : 'left' }}>{caption}</p>;

  if (layout === 'side') {
    return (
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexDirection: flip ? 'row-reverse' : 'row', flexWrap: 'wrap', ...style }} {...rest}>
        <div style={{ flex: 'none', width: 260, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>{frame}{cap}</div>
        {text && <p style={{ margin: 0, flex: 1, minWidth: 220, fontFamily: 'var(--sl-font-body)', fontSize: 'var(--sl-size-lead)', lineHeight: 'var(--sl-leading-body-loose)', color: 'rgba(11,11,11,.85)' }}>{text}</p>}
      </div>
    );
  }
  return (
    <figure style={{
      margin: 0, display: 'flex', flexDirection: 'column', gap: 8,
      alignItems: layout === 'center' ? 'center' : 'stretch', ...style,
    }} {...rest}>
      <div style={{ width: layout === 'center' ? '58%' : '100%', minWidth: 200 }}>{frame}</div>
      {cap}
    </figure>
  );
}
