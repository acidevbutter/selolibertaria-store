Botão único da loja — use para toda ação clicável na área pública; nunca invente outra altura ou canto arredondado.

```jsx
<Button variant="buy" size="buy" full>Comprar agora</Button>
<Button variant="secondary">Ler trecho</Button>
```

- `variant="buy"` (#B3282E) só em comprar / adicionar-e-comprar / finalizar / pagar. Um por tela.
- `variant="primary"` (preto) é o "Adicionar" dos cartões e o CTA neutro.
- `variant="secondary"` é contorno de 1px na cor do texto; `quiet` é contorno fraco para filtros e ordenação.
- Sobre fundo preto passe `on="ink"` — inverte contorno e preenchimento.
