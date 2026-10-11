Número do painel — quatro por linha no desktop 1440.

```jsx
<MetricCard label="Receita paga" value="R$ 4.320,00" />
<MetricCard label="Falhas" value="4" tone="danger" href="/admin/pedidos?status=falhou" />
```

- **Valor em `--sl-font-display` (DCC Ash), 30px.** Receita, contagem, ticket médio, número de pedido: todo número da área logada. Manchete e corpo seguem em Fertigo — trocar as duas é o bug #6.
- Só o cartão clicável ganha filete de 20% e a afordância "Ver →". Cartão não-alvo fica em 14% e sem seta.
- `tone="danger"` só em falha de pagamento, e vinho — nunca vermelho de compra (`--sl-buy` é exclusivo de comprar).
- Sem sparkline, sem variação percentual, sem ícone: o sistema não tem nada disso.
