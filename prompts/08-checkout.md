---
slice: 08
titulo: Checkout: 3 etapas em acordeão + resumo persistente
modelo: "raciocínio (Opus ou equivalente, com plano antes de codar) — checkout mexe com dinheiro real — decisões contaminam pagamento (slice 09)"
depende_de: ["07"]
arquivos_previstos:
  - src/app/checkout/page.tsx
  - src/app/checkout/checkout-form.client.tsx
  - src/ui/checkout/accordion-step.tsx  # novo
  - src/ui/checkout/order-summary.tsx  # novo
canvas: "Canvas Selo Libertaria.dc.html, seção 2d — CONFIRMAR faixa de linhas ao vivo (grep data-screen-label) antes de codar"
custo_estimado: alto
---
## Objetivo
Checkout reestruturado em 3 etapas de acordeão (dados, entrega, pagamento) com `OrderSummary` persistente mostrando prazo, troca e rastreio.

## Contexto
Leia `prompts/00-CONTEXT.md` (seções 3, 4, 5, 6) e `prompts/PROGRESS.md` (entradas de slices anteriores: 7).
Não releia o canvas inteiro — apenas a seção citada acima, e apenas depois de confirmar a faixa de linhas real com `grep -n "data-screen-label" "Canvas Selo Libertaria.dc.html"`.
Arquivo atual concentra tudo: `src/app/checkout/checkout-form.client.tsx`. Ler `AGENTS.md` linhas ~264-273 (checkout convidado, CPF/telefone com máscara progressiva, país travado BR) antes de editar — são contratos de comportamento, não só visuais.

## Especificação
3 etapas em `AccordionStep` (base `src/ui/shadcn/collapsible.tsx`): (1) `Dados para sua compra` — título fixo, helper curto sobre criação automática de conta, CPF/Telefone com máscara progressiva, nome/e-mail normalizados no blur, erros curtos abaixo do campo; (2) Entrega — para autenticado: `Usar meu endereço salvo` / `Usar um novo endereço` / `Retirar na loja`; país travado `Brasil/BR` sem campo visível de país; (3) Pagamento — ver slice 09 para o conteúdo, este slice só monta o container.
`OrderSummary` fica persistente (sticky) ao lado/abaixo do acordeão: itens, frete já cotado no carrinho (slice 07, **sem recálculo aqui**), prazo, política de troca, rastreio pós-compra.
CTA final: `Finalizar compra`. Submit não avança quando dados básicos são inválidos.

## Fora de escopo
Não implementar o conteúdo detalhado do bloco de pagamento (Payment Brick, Pix, bandeiras) — isso é slice 09, este slice só reserva o espaço/etapa. Não recalcular frete.

## Definição de pronto
- [ ] `yarn lint` e `yarn build` passam
- [ ] nenhum `border-radius` novo na área pública tocada por este slice
- [ ] mobile 390px e desktop 1440px conferidos
- [ ] `X-Idempotency-Key` da tentativa de pagamento não é afetado por esta reestruturação de layout (mesma lógica de `src/lib/mercado-pago-orders`, só reposicionada visualmente)
- [ ] checkout convidado sem login prévio continua funcionando ponta a ponta
- [ ] atualizar `prompts/PROGRESS.md` com arquivos tocados e decisões (≤5 linhas)

## Se travar
Pare, escreva a dúvida em `prompts/PROGRESS.md` (seção deste slice) e não invente API nem dado. Não amplie o
escopo para "consertar" algo de um slice vizinho — registre e siga em frente ou peça revisão.
