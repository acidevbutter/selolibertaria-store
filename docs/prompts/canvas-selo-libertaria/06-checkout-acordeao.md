---
slice: 08 (confirmado — todo, sem revisão de escopo)
titulo: Checkout — re-skin completo + acordeão de 3 etapas + OrderSummary persistente
modelo: raciocínio (dinheiro real, maior superfície de risco do projeto)
depende_de: ["01-fundacao-tokens-componentes.md", "00-decisoes-pendentes.md (D3, se D3=(b) o resumo precisa refletir frete do carrinho)"]
arquivos_previstos:
  - src/app/checkout/page.tsx
  - src/app/checkout/checkout-form.client.tsx
  - src/app/checkout/mercado-pago-checkout-form.client.tsx
  - novo src/ui/checkout/accordion-step.tsx
  - novo src/ui/checkout/order-summary.tsx
---

## Por que este é o único slice de tela onde `00-INDEX.md` (todo) bate 100% com a realidade

Diferente de quase todas as outras telas públicas (já re-skinadas para o Canvas há ~2 meses,
confirmado pela auditoria em `README.md`), o checkout **nunca recebeu esse tratamento**:

- `src/app/checkout/page.tsx` usa `rounded-xl border bg-card`, `shadow-sm` — Tailwind/shadcn
  genérico, nenhum token `--editorial-*`.
- `src/app/checkout/mercado-pago-checkout-form.client.tsx:568,637,756` usa
  `rounded-xl border bg-background` nas 3 seções do formulário.
- Nenhuma ocorrência de `Accordion`/`Collapsible`/"acordeão" no arquivo — hoje é uma coluna com 3
  `<section>` sempre visíveis, sem navegação por etapa, mais um `<aside>` com o resumo do pedido.

Isso é trabalho novo de verdade, não retrabalho.

## O que preservar sem tocar (contrato de dado/fluxo — ver `AGENTS.md` ~linha 264)

- Checkout convidado (compra sem login prévio, conta criada por magic link pós-compra) — só
  re-skinar, não mexer no fluxo.
- `X-Idempotency-Key` e toda a lógica de `src/lib/mercado-pago-orders/*` — não tocar.
- Título "Dados para sua compra" e CTA final "Finalizar compra" (já usados, confirmar que
  continuam depois do re-skin — `docs/design/userinterface.md`, atualização 2026-06-30).
- Máscara progressiva de CPF/Telefone (já implementada em algum lugar do formulário atual —
  confirmar onde antes de reescrever o bloco de dados, não duplicar a lógica de máscara).
- País fixo `BR` sem seletor (não reintroduzir campo de país).

## Escopo

1. **Re-skin de todas as seções** para os tokens `--editorial-*` e `border-radius: 0`, seguindo o
   padrão já usado no resto do site (comparar com `src/components/cart-sidebar.tsx` como
   referência de "carrinho já correto" para o mesmo domínio visual).
2. **`AccordionStep`** (`src/ui/checkout/accordion-step.tsx`): usar `src/ui/shadcn/collapsible.tsx`
   como base (já existe, confirmado em `00-CONTEXT.md` §5). 3 etapas: dados/entrega → revisão →
   pagamento (confirmar a divisão exata das 3 etapas contra o conteúdo atual das 3 `<section>` do
   formulário — não inventar uma divisão nova, mapear o que já existe para o formato de etapa).
   Etapa concluída colapsa com resumo visível; etapa atual expandida; navegação entre etapas sem
   perder dado preenchido (crítico — testar indo e voltando entre etapas antes de considerar
   pronto).
3. **`OrderSummary`** (`src/ui/checkout/order-summary.tsx`): extrair o conteúdo do `<aside>` atual
   de `checkout/page.tsx` (itens, subtotal, frete, total) para um componente isolado, sticky no
   desktop (`position: sticky`, já é `h-fit` hoje — trocar por sticky de verdade), colapsável ou
   simplificado em mobile.
4. Se D3 (frete no carrinho) já tiver sido implementado por `05-carrinho-frete.md`, o
   `OrderSummary` deve mostrar o frete já cotado em vez de recalcular — confirmar com quem
   implementou D3 antes de assumir esse contrato.

## Critérios de aceite

- [ ] `yarn lint` e `yarn build` passam.
- [ ] Nenhum `border-radius` novo (exceto o que já existir de propósito documentado).
- [ ] Acordeão funciona: ida e volta entre etapas preserva os dados já digitados.
- [ ] `OrderSummary` sticky no desktop (≥1024px), legível em mobile (390px testado manualmente).
- [ ] Checkout convidado continua funcionando ponta a ponta (teste manual: adicionar item, ir para
      checkout sem login, preencher dados, chegar até a etapa de pagamento).
- [ ] `X-Idempotency-Key` e chamadas a `src/lib/mercado-pago-orders/*` inalteradas (diff dessas
      linhas deve ser zero).
- [ ] Atualizar `prompts/PROGRESS.md`.

## O que não fazer

- Não mexer em `src/lib/mercado-pago-orders/*` nem no webhook.
- Não mudar o contrato de checkout convidado (login pós-compra por magic link).
- Não reintroduzir seletor de país.
- Não implementar a parte de pagamento em si (Pix/cartão/cupom/bandeiras) — isso é
  `07-pagamento-elementos.md`, que depende deste prompt estar pronto primeiro (o `PaymentMethodTile`
  vive dentro da etapa 3 do acordeão criado aqui).
