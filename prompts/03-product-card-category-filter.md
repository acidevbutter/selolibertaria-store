---
slice: 03
titulo: ProductCard único + CategoryFilterBar
modelo: "padrão (Sonnet ou equivalente) — componente compartilhado com estados, mas sem decisão de fundação"
depende_de: ["01"]
arquivos_previstos:
  - src/ui/products/product-card.client.tsx
  - src/ui/products/category-filter-bar.tsx  # novo
  - (arquivos que hoje importam ProductCard — listar após grep, não adivinhar)
canvas: "Canvas Selo Libertaria.dc.html, seção 2b, 2e — CONFIRMAR faixa de linhas ao vivo (grep data-screen-label) antes de codar"
custo_estimado: médio
---
## Objetivo
Um único `ProductCard` reutilizado em home, catálogo, busca e relacionados, mais um `CategoryFilterBar` novo.

## Contexto
Leia `prompts/00-CONTEXT.md` (seções 3, 4, 5, 6) e `prompts/PROGRESS.md` (entradas de slices anteriores: 1).
Não releia o canvas inteiro — apenas a seção citada acima, e apenas depois de confirmar a faixa de linhas real com `grep -n "data-screen-label" "Canvas Selo Libertaria.dc.html"`.
`src/ui/products/product-card.client.tsx` já existe e provavelmente já é usado em mais de um lugar — mapear todos os usos antes de editar (grep por `ProductCard`) para não duplicar um segundo card.

## Especificação
**Card de livro**: capa protagonista (1:1), título maior que preço/meta, autora/status/preço, CTA clara (`Comprar produto` / `Comprar agora` / `Adicionar ao carrinho`), canto externo reto (`radius:0`), hover sutil, altura consistente entre cards do mesmo grid.
CTAs proibidas: `View`, `Browse`, `Read more`, `Open`, `Details`.
**`CategoryFilterBar`**: lista de categorias como filtro horizontal/scrollável, alvo de toque ≥44px, estado ativo visualmente distinto sem depender só de cor (ex.: sublinhado + peso).

**Bloqueio conhecido**: as categorias do canvas (`Livros, Edições sonoras, Zines & impressos, Objetos, Ingressos, Laboratórios`) não existem no modelo de dados atual (ver `00-CONTEXT.md` seção 6). Se implementar o filtro exigir mudar schema/query de produto além de passar uma prop de categorias mockada, **parar e registrar em `PROGRESS.md`** em vez de mudar contrato de dados dentro deste slice de UI.

## Fora de escopo
Não integrar `CategoryFilterBar` em nenhuma página ainda (isso é slice 04/05). Não mudar schema de produto/categoria.

## Definição de pronto
- [ ] `yarn lint` e `yarn build` passam
- [ ] nenhum `border-radius` novo na área pública tocada por este slice
- [ ] mobile 390px e desktop 1440px conferidos
- [ ] `ProductCard` tem um único ponto de definição, sem card duplicado em outro arquivo
- [ ] atualizar `prompts/PROGRESS.md` com arquivos tocados e decisões (≤5 linhas)

## Se travar
Pare, escreva a dúvida em `prompts/PROGRESS.md` (seção deste slice) e não invente API nem dado. Não amplie o
escopo para "consertar" algo de um slice vizinho — registre e siga em frente ou peça revisão.
