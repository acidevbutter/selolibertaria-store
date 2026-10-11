```jsx
<CardBrandRow active="Visa" brands={[
  {name:'Visa', src:'assets/img/icons/visa.svg'},
  {name:'Mastercard', src:'assets/img/icons/mastercard.svg'},
  {name:'Elo'}, {name:'Amex'}, {name:'Hiper'}]} />
```

Detectada pelos 6 primeiros dígitos, mas o seletor fica visível para correção manual.
Só Visa, Mastercard, Pix e Mercado Pago têm arquivo — Elo, Amex e Hiper são wordmark por decisão do sistema.
