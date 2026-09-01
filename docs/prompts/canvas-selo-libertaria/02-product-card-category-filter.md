---
slice: 03 (revisado — parcial)
titulo: ProductCard — reconciliar aspect-ratio; CategoryFilterBar — criar com fallback de dado
modelo: padrão
depende_de: ["01-fundacao-tokens-componentes.md", "00-decisoes-pendentes.md (D2, D4)"]
arquivos_previstos:
  - src/ui/products/product-card.client.tsx
  - novo src/ui/products/category-filter-bar.tsx
---

## O que já está feito (não refazer)

`ProductCard` (`src/ui/products/product-card.client.tsx`) já é um componente único reusado em
home, catálogo, PDP relacionados — não existe duplicação a unificar. Já usa `rounded-none`
(linhas 245, 265) e tokens `--editorial-*`. Não recriar do zero.

## Escopo real deste prompt

### Parte A — aspect-ratio do card (depende de D2)

`product-card.client.tsx:151` usa `aspect-[2/3]`. A PDP (`product-image-gallery.client.tsx:72`) já
usa `aspect-square` (1:1, batendo com `prompts/00-CONTEXT.md` §3). Antes de tocar nisso, checar a
resposta de **D2** em `00-decisoes-pendentes.md`:

- Se D2 = (a) manter `2:3`: este prompt não muda a proporção do card — só documentar a decisão
  num comentário no arquivo (`// aspect-ratio 2:3 intencional para capas de livro, ver D2`).
- Se D2 = (b) forçar `1:1`: trocar `aspect-[2/3]` por `aspect-square`, ajustar
  `object-fit`/fundo (`bg-[color:rgba(247,244,239,0.82)]` já existe na linha 151, deve continuar
  cobrindo a área que sobra) para capas nativas em `2:3` não ficarem cortadas de forma agressiva.
  Testar visualmente com pelo menos 3 produtos reais do catálogo antes de considerar pronto.

### Parte B — `CategoryFilterBar` (depende de D4)

Confirmado: não existe nenhuma ocorrência de `CategoryFilterBar` em `src/` hoje. Checar a resposta
de **D4** em `00-decisoes-pendentes.md`:

- Se D4 = (a) categorias do Canvas modeladas no dado: usar o novo schema/endpoint (o prompt que
  fizer essa modelagem deve documentar o contrato antes deste rodar).
- Se D4 = (b) adiar (fallback): construir `CategoryFilterBar` (`src/ui/products/category-filter-bar.tsx`)
  usando a taxonomia dinâmica que já existe — `listSystemCategoriesWithProducts()` (já importada em
  `src/ui/footer/footer.tsx`, reaproveitar a mesma função). O componente deve:
  - Renderizar uma faixa horizontal com scroll em mobile, sem `border-radius` nos itens ativos/
    inativos.
  - Marcar o item ativo por algo além de cor (peso de fonte + sublinhado/borda, ver
    `PaymentMethodTile`-style "estado selecionado sem depender só de cor" já usado como critério em
    outros prompts desta série).
  - Ser opcional/collapsável — se `listSystemCategoriesWithProducts()` retornar 0 ou 1 categoria
    (cenário provável hoje, catálogo é quase mono-categoria), o componente não deve renderizar nada
    visível (evitar filtro de 1 opção só).
  - Não ser conectado a `/loja` neste prompt — a integração com filtro real de grade é escopo de
    `04-loja-filtros-ordenacao.md`. Aqui só criar o componente e testá-lo isolado (Storybook-like
    página de teste ou uso temporário comentado) ou já plugar direto se o tempo permitir, documentando
    a escolha em `PROGRESS.md`.

## Critérios de aceite

- [ ] `yarn lint` e `yarn build` passam.
- [ ] Decisão de aspect-ratio (D2) aplicada ou documentada como intencionalmente mantida.
- [ ] `CategoryFilterBar` existe, renderiza com dado real de `listSystemCategoriesWithProducts()`,
      não quebra quando há só 1 categoria.
- [ ] Nenhum `border-radius` novo introduzido nos itens do filtro.
- [ ] Atualizar `prompts/PROGRESS.md`.

## O que não fazer

- Não modelar as 6 categorias fixas do Canvas no schema de dado dentro deste prompt — isso é
  escopo do item D4, tratado à parte (provavelmente um prompt de backend, não deste diretório).
  Se ao executar este prompt ficar claro que o fallback (b) é insuficiente, **parar e registrar em
  `prompts/PROGRESS.md`** em vez de absorver a mudança de schema aqui.
- Não mudar a lógica de `quickAddDisabled`/estoque/favoritos do `ProductCard` — só a moldura visual.
