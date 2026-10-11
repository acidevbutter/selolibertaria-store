Etiqueta de categoria e estado — a menor unidade tipográfica do sistema.

```jsx
<Chip tone="ink" size="badge">Livro</Chip>
<Chip tone="buy" size="badge">Pré-venda</Chip>
```

- `tone="buy"` só para urgência real (pré-venda, lançamento). `tone="paper"` (branco com contorno) marca esgotado.
- Estado de pedido (área logada) usa só quatro tons: `sand` = Pago · `quiet` = Pendente · `ink` = Enviado · `danger` = Falhou. Nenhum verde, âmbar ou cinza de biblioteca entra aqui.
- `tone="danger"` nunca aparece sozinho numa tela de detalhe: vem com a frase de saída ("Nada foi cobrado. Reenviar link de pagamento.").
- Sobre imagem, use `size="badge"` ancorado no canto superior esquerdo, sem margem.
