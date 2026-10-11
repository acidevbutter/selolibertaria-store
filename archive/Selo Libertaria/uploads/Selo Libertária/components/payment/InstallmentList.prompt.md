```jsx
<InstallmentList selectedIndex={0} note="Até 6x sem juros. Sem parcelamento com juros — o valor final nunca aumenta."
  options={[{times:'6x',value:'R$ 35,65',note:'sem juros',highlight:true},
            {times:'3x',value:'R$ 71,30',note:'sem juros'},
            {times:'1x',value:'R$ 213,90',note:'à vista',highlight:true}]} />
```

Regra: a loja não oferece parcela com juros. Se aparecer juros, o componente está sendo usado errado.
