Uma única abertura de página para o site inteiro — troque `size` e `aside`, nunca o desenho.

```jsx
<PageHero size="xl" title="little fish, big fish"
  lead="Poesia que mergulha onde sons e luzes chegam dispersos."
  actions={<><Button variant="buy" size="buy">Comprar agora</Button><Button variant="secondary" on="ink">Ler trecho</Button></>}
  aside={<img src="…" alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />} />
```

Sempre preto sobre papel. Duas cores de fundo por página no máximo — o hero gasta uma delas.
