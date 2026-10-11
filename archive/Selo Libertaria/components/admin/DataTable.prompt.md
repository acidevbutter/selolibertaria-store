A tabela da área logada. É **um componente só** — a correção é aqui, não na tela.

```jsx
<DataTable
  columns={[
    { key: 'id', label: 'Pedido', numeric: true },
    { key: 'email', label: 'Cliente', width: '1.4fr' },
    { key: 'total', label: 'Total', numeric: true },
    { key: 'status', label: 'Status', width: '140px', render: (r) => <OrderStatusChip status={r.status} /> },
  ]}
  rows={orders}
  empty="Nenhum pedido de 1 a 13 set. Troque o período ou veja todos os pedidos."
/>
```

- Filetes em tinta transparente: **20% no cabeçalho, 14% entre linhas**, moldura em 14%. `#e4e4e7` e `#f4f4f5` são bug (#8).
- **Raio zero** na moldura. Zebra é tinta a 4% (`--sl-surface-row-hover`).
- Hover de linha: fundo tinta 4% e filete inferior em preto sólido — a mesma troca de filete do cartão de produto. Sem elevação, sem escala, 120ms linear.
- Cabeçalho em micro-label 10px / 900 / .20em, caixa-alta.
- `numeric` em toda coluna de número: DCC Ash 18px.
- Vazio é quadro bege com frase de saída concreta (período, próximo passo). Nunca "Nenhum resultado" solto em cinza.
