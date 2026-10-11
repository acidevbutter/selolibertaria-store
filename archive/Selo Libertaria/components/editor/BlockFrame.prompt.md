Envolve cada bloco do editor e do modo "editar na própria página".

```jsx
<BlockFrame state="hover" actions={['Mover ⇅', 'Duplicar', 'Remover']}>
  <ParagraphBlock>Uma noite de leitura aberta no Centro.</ParagraphBlock>
</BlockFrame>
```

Bloco de dados (vitrine, agenda) usa `state="data"`: tracejado e modo amostra, sem edição de conteúdo.
