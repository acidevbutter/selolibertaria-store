import React from 'react';
import { HeadingBlock } from './HeadingBlock.jsx';
import { ParagraphBlock } from './ParagraphBlock.jsx';
import { ListBlock } from './ListBlock.jsx';
import { QuoteBlock } from './QuoteBlock.jsx';
import { HighlightBlock } from './HighlightBlock.jsx';
import { ImageBlock } from './ImageBlock.jsx';
import { GalleryBlock } from './GalleryBlock.jsx';
import { ButtonBlock } from './ButtonBlock.jsx';
import { DividerBlock } from './DividerBlock.jsx';
import { ProductShelfBlock } from './ProductShelfBlock.jsx';
import { AgendaBlock } from './AgendaBlock.jsx';

const RENDERERS = {
  heading: (n) => <HeadingBlock level={n.level}>{n.text}</HeadingBlock>,
  paragraph: (n) => <ParagraphBlock>{n.text}</ParagraphBlock>,
  list: (n) => <ListBlock ordered={n.ordered} items={n.items} />,
  quote: (n) => <QuoteBlock cite={n.cite}>{n.text}</QuoteBlock>,
  highlight: (n) => <HighlightBlock eyebrow={n.eyebrow}>{n.text}</HighlightBlock>,
  image: (n) => <ImageBlock {...n} />,
  gallery: (n) => <GalleryBlock items={n.items} caption={n.caption} />,
  button: (n) => <ButtonBlock href={n.href} align={n.align}>{n.label}</ButtonBlock>,
  divider: () => <DividerBlock />,
  productShelf: (n, o) => <ProductShelfBlock title={n.title} items={n.items} sample={o.sample} />,
  agenda: (n, o) => <AgendaBlock events={n.events} sample={o.sample} />,
};

/**
 * Renderer ÚNICO do `contentDoc` — o mesmo componente percorre o documento na prévia do admin
 * e na página pública. É o que faz "ver como fica" ser verdade em vez de aproximação.
 */
export function ContentDoc({ doc = [], editable = false, sample = false, gap = 20, style, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, fontFamily: 'var(--sl-font-body)', ...style }} {...rest}>
      {doc.map((node, i) => {
        const render = RENDERERS[node.type];
        if (!render) return null;
        return (
          <div key={node.id || i} data-node-id={editable ? (node.id || i) : undefined} data-node-type={editable ? node.type : undefined}>
            {render(node, { sample })}
          </div>
        );
      })}
    </div>
  );
}
