---
slice: 05
titulo: /loja (catálogo): grid, filtros, ordenação, estados vazio/carregando
modelo: "padrão (Sonnet ou equivalente) — página com estados, sem decisão de fundação"
depende_de: ["03"]
arquivos_previstos:
  - src/app/(store)/products/page.tsx
  - src/app/(store)/products/loading.tsx
  - src/ui/products/product-grid.tsx  # novo ou ajustar existente
canvas: "Canvas Selo Libertaria.dc.html, seção 2c — CONFIRMAR faixa de linhas ao vivo (grep data-screen-label) antes de codar"
custo_estimado: médio
---
## Objetivo
Página de catálogo com grid de `ProductCard`, `CategoryFilterBar` funcional, ordenação e estados vazio/carregando cobertos.

## Contexto
Leia `prompts/00-CONTEXT.md` (seções 3, 4, 5, 6) e `prompts/PROGRESS.md` (entradas de slices anteriores: 3).
Não releia o canvas inteiro — apenas a seção citada acima, e apenas depois de confirmar a faixa de linhas real com `grep -n "data-screen-label" "Canvas Selo Libertaria.dc.html"`.
Rota atual: `src/app/(store)/products/page.tsx` (+ `loading.tsx`). Ver decisão sobre renomear para `/loja` registrada no slice 02 — seguir a mesma decisão aqui (não renomear de novo sem checar `PROGRESS.md`).

## Especificação
Grid responsivo com `ProductCard` (slice 03), `CategoryFilterBar` (slice 03) funcional acima do grid. Ordenação (ex.: relevância, lançamento, preço) como controle simples, sem modal pesado.
**Estado vazio**: mensagem curta em `pt-BR`, sem herança de texto em inglês do fork, com CTA de voltar à Home ou limpar filtro.
**Estado carregando**: skeleton usando `src/ui/shadcn/skeleton.tsx`, mesma geometria do card final (evitar layout shift).
Mesmo com um único título no catálogo, cada card mantém largura editorial controlada e proporção estável — sem esticar horizontalmente nem deixar vazio lateral grande (ver `docs/design/userinterface.md`, atualização 2026-07-01).

## Fora de escopo
Não mexer na PDP (slice 06). Não mudar schema de categoria/produto — se o filtro por categoria exigir isso, seguir o mesmo bloqueio registrado no slice 03.

## Definição de pronto
- [ ] `yarn lint` e `yarn build` passam
- [ ] nenhum `border-radius` novo na área pública tocada por este slice
- [ ] mobile 390px e desktop 1440px conferidos
- [ ] estado vazio e estado carregando cobertos visualmente, não só no código
- [ ] atualizar `prompts/PROGRESS.md` com arquivos tocados e decisões (≤5 linhas)

## Se travar
Pare, escreva a dúvida em `prompts/PROGRESS.md` (seção deste slice) e não invente API nem dado. Não amplie o
escopo para "consertar" algo de um slice vizinho — registre e siga em frente ou peça revisão.
