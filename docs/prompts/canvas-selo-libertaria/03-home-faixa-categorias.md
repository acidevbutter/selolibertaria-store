---
slice: 04 (revisado — parcial)
titulo: Home — só a faixa de categorias faltante (+ limpeza de código morto opcional)
modelo: padrão
depende_de: ["02-product-card-category-filter.md", "00-decisoes-pendentes.md (D4)"]
arquivos_previstos:
  - "src/app/(store)/page.tsx"
  - novo componente em src/ui/home/ (nome sugerido: home-category-band.tsx)
---

## O que já está feito (não refazer)

`src/app/(store)/page.tsx` já compõe a Home na ordem exata da spec: `Header` (global) →
`HomeHero` → `HomeManifesto` → `HomeFeaturedBooks` (produto destaque + catálogo curto) →
`HomeProgramGrid` (Sarau Safado/eventos) → `Footer` (global). Não reordenar nem recriar essas
seções.

`HomeHero` (`src/ui/home/home-hero.tsx`) já suporta `content.hero.mode === "product"` — o "hero de
lançamento" pedido pela spec já existe e já é usado condicionalmente em `page.tsx` (linhas 30-32).
Não recriar esse modo.

## Código morto identificado (não é pendência de UI — é limpeza, opcional)

`src/ui/home/home-author-spotlight.tsx`, `home-community-cta.tsx`, `home-immersive-gallery.tsx` e
`home-top-bar.tsx` existem no repo mas não são importados em nenhum lugar (`grep -rl` para cada um
retorna vazio fora do próprio arquivo). Se decidir remover, confirmar primeiro que não são o alvo
de algum PR em andamento — não é obrigatório para este prompt, mas pode ser feito na mesma PR se o
tempo permitir, para não deixar 4 arquivos mortos junto do trabalho novo.

## Escopo real deste prompt

Adicionar a faixa de categorias entre `HomeFeaturedBooks` e `HomeProgramGrid` (ou onde a leitura do
Canvas — inacessível nesta geração — sugerir; na ausência disso, seguir a posição que já faz
sentido editorial: depois do destaque, antes da agenda). Depende de **D4** em
`00-decisoes-pendentes.md`:

- Se D4 = (a): consumir o novo dado de categoria já modelado.
- Se D4 = (b) fallback: reaproveitar `CategoryFilterBar` de `02-product-card-category-filter.md`
  (ou uma variante mais editorial dela, se o componente de filtro for muito "utilitário" para a
  Home) alimentada por `listSystemCategoriesWithProducts()`. Se essa função retornar 0-1 categoria
  (cenário provável hoje), **não renderizar a seção** em vez de mostrar uma faixa vazia ou com um
  item só — documentar essa condição no componente.

## Critérios de aceite

- [ ] `yarn lint` e `yarn build` passam.
- [ ] Ordem das seções da Home preservada (Hero→Manifesto→Featured→[nova faixa]→ProgramGrid).
- [ ] Faixa de categorias não renderiza (ou renderiza um estado claramente intencional) quando há
      menos de 2 categorias reais.
- [ ] Se a limpeza de código morto for feita, confirmar com `grep -rl` que os 4 arquivos removidos
      realmente não têm nenhum import antes de apagar.
- [ ] Atualizar `prompts/PROGRESS.md`.

## O que não fazer

- Não reordenar as seções existentes da Home.
- Não modelar categoria no dado dentro deste prompt (mesma ressalva de D4 do prompt 02).
- Não remover os 4 arquivos de `src/ui/home/` sem antes confirmar por grep que estão realmente sem
  uso — e não é obrigatório removê-los para este prompt ser considerado pronto.
