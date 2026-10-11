Item de lista do painel — páginas, eventos, pedidos, e-mails, imagens.

```jsx
<DeskRow as="a" href="/admin/eventos/14" title="Sarau Safado #14" data="12 set 14:32" badge={<StateBadge tone="rascunho">Rascunho</StateBadge>} />
```

Para uma lista longa, empilhe dentro de um `SheetCard tone="panel"` com `pad={0}` e marque `last` na última.
