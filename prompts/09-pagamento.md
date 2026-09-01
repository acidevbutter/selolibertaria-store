---
slice: 09
titulo: Elementos de pagamento: cartão, Pix, boleto, cupom, bandeiras, erro/sucesso
modelo: "raciocínio (Opus ou equivalente, com plano antes de codar) — pagamento com dinheiro real — maior superfície de risco do projeto"
depende_de: ["08"]
arquivos_previstos:
  - src/app/checkout/mercado-pago-checkout-form.client.tsx
  - src/ui/checkout/payment-method-tile.tsx  # novo
  - src/ui/checkout/trust-row.tsx  # novo
canvas: "Canvas Selo Libertaria.dc.html, seção 2f — CONFIRMAR faixa de linhas ao vivo (grep data-screen-label) antes de codar"
custo_estimado: alto
---
## Objetivo
Bloco de pagamento dentro da etapa 3 do checkout: escolha Pix/cartão, Payment Brick, cupom, bandeiras aceitas, estados de erro e sucesso.

## Contexto
Leia `prompts/00-CONTEXT.md` (seções 3, 4, 5, 6) e `prompts/PROGRESS.md` (entradas de slices anteriores: 8).
Não releia o canvas inteiro — apenas a seção citada acima, e apenas depois de confirmar a faixa de linhas real com `grep -n "data-screen-label" "Canvas Selo Libertaria.dc.html"`.
Arquivo atual: `src/app/checkout/mercado-pago-checkout-form.client.tsx`. **Não mexer na integração com a API do Mercado Pago** (`src/lib/mercado-pago-orders/*`) — este slice é sobre apresentação dos elementos, a lógica de idempotência/consulta de status já existe e é sensível (ver `AGENTS.md` ~2026-07-18).

## Especificação
`PaymentMethodTile`: escolha explícita entre Pix e cartão, ícones de bandeiras (`assets/img/icons/visa.svg`, `mastercard.svg`, `pix.svg`, `mercado-pago.svg`), estado selecionado sem depender só de cor.
Pix: QR Code, código copiável, ação `Já paguei — verificar pagamento` (consulta status sem esconder o QR pendente enquanto pendente).
Cartão: Payment Brick do Mercado Pago renderizado dentro do tile, sem reimplementar campos de cartão manualmente.
Cupom: campo compacto com feedback imediato (aplicado/inválido).
`TrustRow`: selo de pagamento seguro + bandeiras aceitas, discreto, sem virar banner grande.
Estados obrigatórios: erro de pagamento (mensagem curta, ação de tentar de novo sem perder dados preenchidos), sucesso (confirmação clara, próximo passo — ver `checkout/return`).

## Fora de escopo
Não tocar em `src/lib/mercado-pago-orders/*` nem no webhook (`/api/mercado-pago/webhook`). Não mudar `X-Idempotency-Key`. Não adicionar provider de pagamento novo — Mercado Pago continua único.

## Definição de pronto
- [ ] `yarn lint` e `yarn build` passam
- [ ] nenhum `border-radius` novo na área pública tocada por este slice
- [ ] mobile 390px e desktop 1440px conferidos
- [ ] fluxo de erro testado manualmente (cartão recusado) sem perder os dados do formulário de dados/entrega
- [ ] Pix pendente não esconde o QR antes da confirmação real do pagamento
- [ ] atualizar `prompts/PROGRESS.md` com arquivos tocados e decisões (≤5 linhas)

## Se travar
Pare, escreva a dúvida em `prompts/PROGRESS.md` (seção deste slice) e não invente API nem dado. Não amplie o
escopo para "consertar" algo de um slice vizinho — registre e siga em frente ou peça revisão.
