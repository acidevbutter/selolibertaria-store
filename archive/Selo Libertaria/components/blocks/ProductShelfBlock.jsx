import React from 'react';
import { MediaPlaceholder } from '../editor/MediaPlaceholder.jsx';

/** Bloco `productShelf` · vitrine. A editora escolhe os títulos por busca; preço e estoque vêm do catálogo. */
export function ProductShelfBlock({ title, items = [], sample = false, style, ...rest }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12, ...style }} {...rest}>
      {title && <h3 style={{ margin: 0, fontFamily: 'var(--sl-font-head)', fontSize: 24, fontWeight: 900, letterSpacing: '-.03em', textTransform: 'uppercase' }}>{title}</h3>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
        {items.map((p, i) => (
          <a key={i} href={p.href || '#'} style={{ display: 'flex', flexDirection: 'column', background: 'var(--sl-paper-pure)', border: '1px solid var(--sl-line-hairline)', textDecoration: 'none', color: 'var(--sl-ink)' }}>
            {p.src
              ? <img src={p.src} alt="" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }} />
              : <MediaPlaceholder ratio="1 / 1" caption={p.file} />}
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: 'var(--sl-font-display)', fontSize: 18, letterSpacing: '-.02em' }}>{p.name}</span>
              <span style={{ fontFamily: 'var(--sl-font-display)', fontSize: 18, color: sample ? 'rgba(11,11,11,.45)' : 'var(--sl-ink)' }}>{sample ? 'R$ ——,——' : p.price}</span>
              {p.meta && <span style={{ fontSize: 13, color: 'var(--sl-text-muted)' }}>{p.meta}</span>}
            </div>
          </a>
        ))}
      </div>
      {sample && <p style={{ margin: 0, fontFamily: 'var(--ad-font-mono)', fontSize: 'var(--ad-size-data-sm)', color: 'var(--ad-text-quiet)' }}>modo amostra · preço e estoque vêm do catálogo na publicação</p>}
    </section>
  );
}
