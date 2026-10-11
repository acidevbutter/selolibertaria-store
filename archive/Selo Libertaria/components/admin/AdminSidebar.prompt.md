Barra do painel — o componente que o fork do admin mais deformava.

```jsx
<AdminSidebar
  logoSrc="/assets/img/selolibertaria.png"
  selectedId="painel"
  items={[{ id: 'painel', label: 'Painel' }, { id: 'pedidos', label: 'Pedidos' }]}
  session={{ name: 'Marcos Vinícius', email: 'admin@selolibertaria.com.br' }}
/>
```

- **Raio zero**, decidido: o `border-radius: 12px` herdado sai do logo e do item. Não existe `--sl-radius-admin-nav`; a alternativa foi descartada.
- **Selecionado** é bloco sólido vinho sangrando até as duas bordas, texto em papel, caixa-alta e peso 900. Nunca fundo bege suave (preto sobre bege era o bug de contraste).
- **Hover** é papel a 6% (`--sl-nav-hover-on-ink`), 120ms linear. Sem elevação, sem deslocamento.
- Item tem 44px de altura — alvo mínimo. Sem marcador redondo, sem ícone: a hierarquia é tipográfica.
- A barra é a mesma no `/admin`; `/user` não usa sidebar.
