---
slice: 09 (confirmado — todo na apresentação; a lógica de pagamento já funciona)
titulo: "PaymentMethodTile + TrustRow — vestir o que já funciona (Pix/cartão)"
modelo: raciocínio (dinheiro real — maior superfície de risco do projeto)
depende_de: ["06-checkout-acordeao.md"]
arquivos_previstos:
  - src/app/checkout/mercado-pago-checkout-form.client.tsx
  - novo src/ui/checkout/payment-method-tile.tsx
  - novo src/ui/checkout/trust-row.tsx
---

## O que já funciona hoje (não reimplementar a lógica, só vestir)

Confirmado por leitura de `src/app/checkout/mercado-pago-checkout-form.client.tsx`:

- Pix: QR Code + código copia-e-cola + ação "Já paguei" que consulta status sem esconder o QR
  pendente (linhas 765-831, função `handlePixPaymentCheck`).
- Cartão: Payment Brick do Mercado Pago renderizado dentro da seção (linha 923,
  `id="mercado-pago-payment-brick"`), com opção de salvar cartão (linha 931).
- Toda a lógica de idempotência/consulta de status em `src/lib/mercado-pago-orders/*` — **não
  tocar**, confirmado como regra travada em `00-CONTEXT.md` §6 e `AGENTS.md`.

## O que realmente falta (confirmado por grep vazio no arquivo atual)

Nenhuma ocorrência de "boleto", "cupom", "bandeira", "TrustRow" em
`mercado-pago-checkout-form.client.tsx`. Isso significa:

- **Boleto não existe** — e, segundo `prompts/00-CONTEXT.md` §6 ("Mercado Pago é o único provider
  ativo (Pix + cartão via Payment Brick)"), não deveria existir. O título original da slice 09
  ("cartão, Pix, boleto, cupom...") provavelmente herdou "boleto" de um prompt genérico de
  e-commerce — **não adicionar boleto** sem um pedido explícito e novo, fora desta auditoria.
- **Cupom já existe, mas no carrinho** (`cart-sidebar.tsx`, confirmado em
  `05-carrinho-frete.md`), não dentro do checkout. Não duplicar o campo de cupom aqui — o cupom
  aplicado no carrinho deve simplesmente refletir no total do `OrderSummary` (criado em
  `06-checkout-acordeao.md`).
- **Ícones de bandeira**: já existem como assets (`public/images/icons/{visa,mastercard,pix,
  mercado-pago}.svg`, já usados em `src/ui/footer/footer.tsx`) mas não aparecem na seção de
  pagamento do checkout — só precisam ser referenciados, não criados.
- **`PaymentMethodTile` e `TrustRow`**: não existem como componentes isolados — a lógica de Pix e
  cartão está toda inline dentro do client component.

## Escopo

1. **`PaymentMethodTile`** (`src/ui/checkout/payment-method-tile.tsx`): escolha explícita entre
   Pix e cartão, com os ícones de bandeira já existentes em `public/images/icons/`. Estado
   selecionado marcado por mais que cor (borda + peso de texto, ou marcador explícito) — mesmo
   critério de acessibilidade já usado nos outros prompts desta série. Envolver a lógica de Pix
   (QR/copia-cola/"Já paguei") e a renderização do Payment Brick que já existem, sem reescrevê-las
   — só mover para dentro do novo componente e passar os handlers já existentes como props.
2. **`TrustRow`** (`src/ui/checkout/trust-row.tsx`): selo de pagamento seguro + os 4 ícones de
   bandeira já usados no footer, discreto (não é banner grande), posicionado dentro ou logo abaixo
   da etapa de pagamento do acordeão (criado em `06-checkout-acordeao.md`).
3. **Estados de erro/sucesso**: confirmar que existe hoje uma mensagem curta de erro de pagamento
   (procurar `setMessage` no arquivo atual) que não apaga os dados já preenchidos nas etapas
   anteriores — se já existir, só re-skinar; se não existir claramente, criar sem inventar um novo
   fluxo de erro paralelo ao que o Mercado Pago já retorna.
4. Re-skin visual (tokens `--editorial-*`, `border-radius: 0`) da seção inteira, coerente com o
   resto do checkout feito em `06-checkout-acordeao.md`.

## Critérios de aceite

- [ ] `yarn lint` e `yarn build` passam.
- [ ] Nenhum `border-radius` novo na área pública tocada.
- [ ] Fluxo de erro testado manualmente (cartão recusado — usar cartão de teste do Mercado Pago em
      sandbox) sem perder os dados de dados/entrega já preenchidos.
- [ ] Pix pendente não esconde o QR antes da confirmação real do pagamento.
- [ ] Nenhum provider de pagamento novo adicionado (Mercado Pago continua único).
- [ ] Nenhuma alteração em `X-Idempotency-Key`, webhook, ou `src/lib/mercado-pago-orders/*`.
- [ ] Atualizar `prompts/PROGRESS.md`.

## O que não fazer

- Não adicionar boleto sem pedido explícito e novo — não é regra de negócio confirmada
  (`00-CONTEXT.md` §6 diz o oposto).
- Não duplicar o campo de cupom dentro do checkout — ele já vive no carrinho.
- Não tocar em `src/lib/mercado-pago-orders/*` nem no webhook `/api/mercado-pago/webhook`.
- Não mudar `X-Idempotency-Key`.
