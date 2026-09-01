---
slice: 05 (revisado — parcial)
titulo: "/loja (catálogo) — só filtros e ordenação, o resto já está pronto"
modelo: padrão
depende_de: ["02-product-card-category-filter.md", "00-decisoes-pendentes.md (D4)"]
arquivos_previstos:
  - "src/app/(store)/products/page.tsx"
  - src/ui/products/product-list.tsx
---

## O que já está feito (não refazer)

`src/app/(store)/products/page.tsx` já implementa a gramática do Canvas ponta a ponta:
`CatalogIntro` como hero dominante em `tone="dark"` (fundo `--editorial-ink`), uma única seção de
grade (`ProductList`, dentro de `EditorialShell`), e uma seção de fechamento em
`--editorial-beige` antes do `<Footer />` global (linhas finais do arquivo, seção
`bg-[color:var(--editorial-beige)]`). Não recriar essa estrutura.

Estado vazio já existe (bloco `border-dashed` com `page.listing?.emptyText`, dentro de `page.tsx`).
Estado de carregamento já existe (`src/app/(store)/products/loading.tsx`). Não recriar nenhum dos
dois.

## Escopo real deste prompt

`src/ui/products/product-list.tsx` hoje não tem nenhum controle de filtro ou ordenação — é uma
grade direta dos produtos recebidos via prop. Adicionar:

1. **Filtro por categoria**, usando `CategoryFilterBar` de `02-product-card-category-filter.md` —
   mesma ressalva de D4: se o fallback (taxonomia dinâmica) retornar poucas categorias, o filtro
   pode ficar visualmente presente mas sem efeito prático até o dado real existir; documentar isso
   em vez de simular categorias fictícias.
2. **Ordenação** (ex.: relevância/preço/lançamento — confirmar rótulos exatos com quem decide o
   copy, seguindo o padrão de `docs/design/userinterface.md` de manter labels em pt-BR fixo). A
   ordenação client-side é aceitável se o volume de produtos for pequeno (catálogo hoje é enxuto,
   `first: 100` já busca "tudo" em `commerce.product.browse`) — não é obrigatório implementar
   ordenação server-side neste prompt.

Ambos os controles devem ficar entre o hero (`CatalogIntro`) e a grade (`ProductList`), sem quebrar
o layout de `header` (o bloco `Reveal` com eyebrow/título) que já existe dentro de
`product-list.tsx`.

## Critérios de aceite

- [ ] `yarn lint` e `yarn build` passam.
- [ ] Filtro de categoria não quebra quando há 0-1 categoria real (mesmo critério do prompt 03).
- [ ] Ordenação tem pelo menos 2 opções reais e persiste a escolha via querystring (para
      compartilhar link filtrado) ou state local — decidir o mais simples que não quebre SSR do
      `commerce.product.browse`.
- [ ] Estado vazio/carregando existentes continuam funcionando sem alteração de comportamento.
- [ ] Nenhum `border-radius` novo nos controles.
- [ ] Atualizar `prompts/PROGRESS.md`.

## O que não fazer

- Não recriar o hero (`CatalogIntro`) nem a seção de fechamento — já estão prontos.
- Não implementar busca full-text aqui — isso já existe em `/search` como rota separada
  (`src/lib/search`), fora do escopo deste prompt.
- Não modelar categoria no dado (mesma ressalva de D4 dos prompts 02/03).
