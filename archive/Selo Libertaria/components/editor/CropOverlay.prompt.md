Recorte de imagem sem sair do editor.

```jsx
const [sel, setSel] = React.useState({ x: 8, y: 12, w: 84, h: 62 });
<CropOverlay
  file="sarau-14-publico.jpg" dimensions="3024×4032" src={url}
  target={target} onTarget={setTarget}
  selection={sel} onSelection={setSel}
  targets={[{ layout: 'cover', label: 'Capa do evento · 3:4' }, { layout: 'wide', label: 'Faixa larga · 16:9' }, { layout: 'square', label: 'Quadrada · 1:1' }]}
  alt={alt} onAlt={(e) => setAlt(e.target.value)}
  weight="2,1 MB → 240 KB · webp + jpg · usada em 3 lugares"
  dragOver={dragging} onCancel={close} onConfirm={apply}
/>
```

Trocar o alvo troca a proporção da moldura na hora — é a prévia, não um aviso depois de publicar.
