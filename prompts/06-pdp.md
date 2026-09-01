---
slice: 06
titulo: PDP /product/[slug]: galeria 1:1, painel de compra, ficha, relacionados
modelo: "padrão (Sonnet ou equivalente) — página com estados, sem decisão de fundação"
depende_de: ["03"]
arquivos_previstos:
  - src/app/(store)/product/[slug]/page.tsx
  - src/app/(store)/product/[slug]/product-image-gallery.client.tsx
  - src/app/(store)/product/[slug]/product-image-modal.tsx
canvas: "Canvas Selo Libertaria.dc.html, seção 2c — CONFIRMAR faixa de linhas ao vivo (grep data-screen-label) antes de codar"
custo_estimado: médio
---
## Objetivo
Página de produto com capa liderando a primeira dobra, painel de compra enxuto, ficha técnica e relacionados usando `ProductCard`.

## Contexto
Leia `prompts/00-CONTEXT.md` (seções 3, 4, 5, 6) e `prompts/PROGRESS.md` (entradas de slices anteriores: 3).
Não releia o canvas inteiro — apenas a seção citada acima, e apenas depois de confirmar a faixa de linhas real com `grep -n "data-screen-label" "Canvas Selo Libertaria.dc.html"`.
Arquivos atuais: `src/app/(store)/product/[slug]/page.tsx`, `product-image-gallery.client.tsx`, `product-image-modal.tsx`, `loading.tsx`.

## Especificação
Galeria de imagem em proporção 1:1 liderando a primeira dobra. Painel de compra à direita (desktop) enxuto: título, autora/status, `PriceBlock` (slice 01), botões `Comprar` e `Ler trecho` (retos, tamanhos do slice 01). Sinopse com leitura confortável (corpo `16/1.7`). Faixa preta para trecho/citação. Seção de relacionados usa `ProductCard` (slice 03).

## Fora de escopo
Não mexer no carrinho (slice 07) além do botão `Comprar` disparar a ação já existente. Não mudar contrato de dados do produto.

## Definição de pronto
- [ ] `yarn lint` e `yarn build` passam
- [ ] nenhum `border-radius` novo na área pública tocada por este slice
- [ ] mobile 390px e desktop 1440px conferidos
- [ ] galeria mantém 1:1 em mobile e desktop, sem crop inesperado
- [ ] atualizar `prompts/PROGRESS.md` com arquivos tocados e decisões (≤5 linhas)

## Se travar
Pare, escreva a dúvida em `prompts/PROGRESS.md` (seção deste slice) e não invente API nem dado. Não amplie o
escopo para "consertar" algo de um slice vizinho — registre e siga em frente ou peça revisão.
