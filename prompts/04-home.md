---
slice: 04
titulo: Home multicategoria: hero de lançamento + faixa de categorias + Em destaque
modelo: "padrão (Sonnet ou equivalente) — montagem de página a partir de primitivos já prontos"
depende_de: ["02", "03"]
arquivos_previstos:
  - src/app/(store)/page.tsx
  - src/ui/home/hero-launch.tsx  # novo ou ajustar existente
  - src/ui/home/manifesto.tsx  # novo ou ajustar existente
  - src/ui/home/featured-product.tsx  # novo ou ajustar existente
canvas: "Canvas Selo Libertaria.dc.html, seção 2b — CONFIRMAR faixa de linhas ao vivo (grep data-screen-label) antes de codar"
custo_estimado: médio
---
## Objetivo
Home seguindo a ordem visual do canvas: Header, Hero escuro/papel com capa dominante, Manifesto, Produto em destaque, Catálogo curto, Sarau Safado, Newsletter/Footer.

## Contexto
Leia `prompts/00-CONTEXT.md` (seções 3, 4, 5, 6) e `prompts/PROGRESS.md` (entradas de slices anteriores: 2, 3).
Não releia o canvas inteiro — apenas a seção citada acima, e apenas depois de confirmar a faixa de linhas real com `grep -n "data-screen-label" "Canvas Selo Libertaria.dc.html"`.
Página atual: `src/app/(store)/page.tsx`. Ordem já documentada em `docs/design/userinterface.md` seção Home — usar como checklist.

## Especificação
Ordem: (1) Header — já vem do layout (slice 02); (2) Hero escuro/papel com capa dominante e CTA principal de compra na primeira dobra; (3) Manifesto claro e respirado; (4) Produto em destaque; (5) Catálogo curto com três capas/cards usando `ProductCard` do slice 03; (6) Sarau Safado em painel forte; (7) Newsletter/Footer — já vem do layout.
Máx. 2 cores de fundo por seção visível por vez, alternando papel → preto → bege. Reduzir blocos extras que enfraqueçam fidelidade ao canvas (não adicionar seção nova fora dessas 7).

## Fora de escopo
Não tocar em `/products` (catálogo completo, slice 05) nem em `/product/[slug]` (slice 06). Não mudar o `CategoryFilterBar` de comportamento — se aparecer na Home, é só a faixa de categorias, sem filtro funcional pesado.

## Definição de pronto
- [ ] `yarn lint` e `yarn build` passam
- [ ] nenhum `border-radius` novo na área pública tocada por este slice
- [ ] mobile 390px e desktop 1440px conferidos
- [ ] CTA principal de compra visível sem rolar na primeira dobra em 390px e 1440px
- [ ] atualizar `prompts/PROGRESS.md` com arquivos tocados e decisões (≤5 linhas)

## Se travar
Pare, escreva a dúvida em `prompts/PROGRESS.md` (seção deste slice) e não invente API nem dado. Não amplie o
escopo para "consertar" algo de um slice vizinho — registre e siga em frente ou peça revisão.
