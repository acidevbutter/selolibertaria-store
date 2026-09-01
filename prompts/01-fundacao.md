---
slice: 01
titulo: Fundação: tokens, fontes, reset radius:0, Button, Field, Badge, PriceBlock
modelo: "raciocínio (Opus ou equivalente, com plano antes de codar) — decisão de fundação que contamina todo o resto — todo slice seguinte consome estes primitivos"
depende_de: []
arquivos_previstos:
  - src/app/globals.css
  - src/ui/shadcn/button.tsx
  - src/ui/shadcn/badge.tsx
  - src/ui/shadcn/field.tsx  # novo
  - src/ui/price-block.tsx  # novo
  - public/fonts/DCC-Ash.otf  # bloqueante — ver Definição de pronto
canvas: "Canvas Selo Libertaria.dc.html, seção 2a, 2e — CONFIRMAR faixa de linhas ao vivo (grep data-screen-label) antes de codar"
custo_estimado: alto
---
## Objetivo
Estabelecer os tokens visuais (cor, tipografia, geometria) e os primitivos `Button`, `Field`, `Badge`, `PriceBlock` que todos os slices seguintes vão consumir, sem tocar em nenhuma página ainda.

## Contexto
Leia `prompts/00-CONTEXT.md` (seções 3, 4, 5, 6) e `prompts/PROGRESS.md` (entradas de slices anteriores: —).
Não releia o canvas inteiro — apenas a seção citada acima, e apenas depois de confirmar a faixa de linhas real com `grep -n "data-screen-label" "Canvas Selo Libertaria.dc.html"`.
Este é o único slice autorizado a editar `src/app/globals.css` na camada de tokens e a criar/estender primitivos em `src/ui/shadcn/`. Nenhum slice depois deste deve reescrever token — só consumir.

## Especificação
**Cores** (adicionar como CSS vars/`@theme` tokens, não substituir o que já funciona no admin):
`#0B0B0B` preto · `#141210` fundo canvas [CONFIRMAR contra canvas ao vivo] · `#F7F4EF` papel · `#D8D0C4` bege · `#7A1E22` vinho · `#B3282E` vinho claro/ação [CONFIRMAR].

**Tipografia**: `DCCAsh` para numerais/preço (bloqueado — ver Definição de pronto), `Fertigo` (já em `public/fonts/FertigoPro-Regular.otf`) para títulos/corpo.
Escala: hero `96/60/40` · seção `56` · card `22` · corpo `16` linha `1.7` · micro-label `10–11px` uppercase `letter-spacing:.24em`.

**Geometria**: `border-radius:0` em todo elemento da área pública (não aplicar a `admin/*` neste slice). Campo (`Field`) `52px` de altura. `Button` em 3 tamanhos: `56px` / `48px` / `44px` (mínimo mobile). Nenhum botão pode renderizar abaixo de `44px` de alvo de toque.

**Estados obrigatórios em `Button`, `Field`, `Badge`**: default, hover, focus (visível, sem depender só de cor), disabled. `Field` também: vazio, preenchido, erro (mensagem curta abaixo do campo).

**`PriceBlock`**: recebe valor + moeda, usa `.price-font`, alinhamento e peso conforme escala acima; variante compacta (card) e variante grande (PDP/hero).

## Fora de escopo
Nenhuma página (`Home`, `/products`, `/checkout` etc.) é tocada neste slice. Não mexer no admin. Não mexer em `Nav`/`Footer` (slice 02). Não criar `CategoryFilterBar`, `CartLine`, `OrderSummary` etc. (slices seguintes).

## Definição de pronto
- [ ] `yarn lint` e `yarn build` passam
- [ ] nenhum `border-radius` novo na área pública tocada por este slice
- [ ] mobile 390px e desktop 1440px conferidos
- [ ] `DCC-Ash.otf` adicionado em `public/fonts/` e referenciado via `@font-face`/`next/font/local` — **se a fonte não estiver disponível, parar aqui e registrar o bloqueio em `PROGRESS.md`; não substituir por outra fonte sem aprovação**
- [ ] `Button`, `Field`, `Badge`, `PriceBlock` têm story/uso de exemplo em pelo menos uma página existente (não precisa ser a final) para validação visual manual
- [ ] atualizar `prompts/PROGRESS.md` com arquivos tocados e decisões (≤5 linhas)

## Se travar
Pare, escreva a dúvida em `prompts/PROGRESS.md` (seção deste slice) e não invente API nem dado. Não amplie o
escopo para "consertar" algo de um slice vizinho — registre e siga em frente ou peça revisão.
