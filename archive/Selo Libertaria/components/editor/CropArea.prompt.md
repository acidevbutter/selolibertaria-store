Seleção de recorte dentro do `CropOverlay`.

```jsx
const [sel, setSel] = React.useState({ x: 8, y: 12, w: 84, h: 62 });
<CropArea src={file.url} ratio={3 / 4} selection={sel} onChange={setSel} />
```

A proporção vem do alvo escolhido ("Capa do evento · 3:4"), nunca de largura em pixel.
