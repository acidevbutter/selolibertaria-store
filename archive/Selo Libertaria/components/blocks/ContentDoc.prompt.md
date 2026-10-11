Renderiza uma página inteira a partir do `contentDoc` — no editor e no site.

```jsx
<ContentDoc doc={page.draftDoc} editable sample />
<ContentDoc doc={page.publishedDoc} />
```

Tipo fora dos 11 é ignorado aqui e recusado com 422 no servidor. Nunca renderize HTML livre.
