Resumo de valores do carrinho e do checkout.

```jsx
<OrderSummary lines={[{label:'Subtotal',value:'R$ 192,00'},{label:'Frete · PAC',value:'R$ 21,90'}]}
  total="R$ 213,90" footnote="Valor final. Não há taxas adicionais na próxima etapa." />
```

Regra do sistema: o frete já entra aqui no carrinho. O total nunca muda entre carrinho e pagamento.
