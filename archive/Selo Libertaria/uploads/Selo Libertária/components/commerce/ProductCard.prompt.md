O cartão de produto. Serve livro, edição sonora, zine, objeto, ingresso e laboratório sem variação de desenho — a imagem é sempre 1:1.

```jsx
<ProductCard image={<img src="…" alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />}
  badge="Pré-venda" badgeTone="buy" category="Livro" title="little fish, big fish"
  blurb="Natália Nolli Sasso · poesia · 96 páginas." price="R$ 72,00" note="Envio 12 set" />
```

- Esgotado: `soldOut` + `badge="Esgotado" badgeTone="paper"` + `action="Avise-me"`.
- Laboratório e ingresso trocam só o `action` ("Inscrever", "Garantir ingresso").
- Altura travada pelo `blurb` com `flex:1` — a grade fecha alinhada mesmo com textos desiguais.
