Topbar do painel — sempre no topo da coluna de conteúdo, ao lado do `ShellSidebar`.

```jsx
<ShellTopbar initials="MA" searchProps={{ value: q, onChange: onQ }} />
```

Passe `children` só para chips de modo (Editar / Ver). Ações de página ficam no `DeskPageHeader`, não aqui.
