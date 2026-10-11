```jsx
<PaymentState state="declined" title="Cartão recusado pelo emissor"
  body="Nada foi cobrado. Tente outro cartão ou pague por Pix — o carrinho fica salvo."
  actions={<><Button variant="buy" size="sm">Pagar com Pix</Button><Button variant="secondary" size="sm">Outro cartão</Button></>} />
```

- processing: preto sólido, barra vermelha, "não feche a página".
- approved: papel com ✓ vinho e o número do pedido.
- declined: vinho sobre lavagem, com saída obrigatória e a frase "nada foi cobrado".
- waiting: bege, com o tempo de reserva dos itens.
