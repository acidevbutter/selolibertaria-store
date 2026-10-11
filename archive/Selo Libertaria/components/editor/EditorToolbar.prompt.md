Barra de ferramentas do editor de páginas, no topo da mesa.

```jsx
<EditorToolbar
  undoSteps={10}
  groups={[
    [{ label: 'Parágrafo ▾' }],
    [{ label: 'B', square: true, active: true }, { label: 'I', square: true }, { label: 'U', square: true }, { label: 'Link' }],
    [{ label: '• Lista' }, { label: '1. Numerada' }, { label: 'Citação' }],
    [{ label: 'Destaque do selo', accent: true }, { label: 'Imagem' }, { label: 'Botão' }, { label: 'Separador' }],
  ]}
/>
```
