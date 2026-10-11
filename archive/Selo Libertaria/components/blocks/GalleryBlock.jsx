import React from 'react';
import { MediaPlaceholder } from '../editor/MediaPlaceholder.jsx';

/** Bloco `gallery` · três a seis fotos em grade 1:1. Abaixo de três vira centralizada; acima de seis, recusa. */
export function GalleryBlock({ items = [], caption, style, ...rest }) {
  const cols = items.length >= 5 ? 3 : Math.min(items.length || 3, 3);
  return (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 8, ...style }} {...rest}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ',minmax(0,1fr))', gap: 8 }}>
        {(items.length ? items : [{}, {}, {}]).map((it, i) => (
          it.src
            ? <img key={i} src={it.src} alt={it.alt || ''} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block', background: 'var(--sl-sand)' }} />
            : <MediaPlaceholder key={i} ratio="1 / 1" caption={it.file} />
        ))}
      </div>
      {caption && <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'rgba(11,11,11,.55)' }}>{caption}</p>}
    </figure>
  );
}
