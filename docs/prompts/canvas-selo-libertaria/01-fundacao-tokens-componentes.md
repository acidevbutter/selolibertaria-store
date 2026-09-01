---
slice: 01 (revisado — parcial)
titulo: Fundação — só o que falta de verdade (radius, Button, Field, PriceBlock)
modelo: raciocínio (mexe em base herdada por toda a área pública)
depende_de: []
bloqueio_conhecido: "fonte DCCAsh.otf ausente do repo — ver seção Bloqueio abaixo"
arquivos_previstos:
  - src/app/globals.css
  - src/ui/shadcn/button.tsx
  - src/ui/shadcn/field.tsx  # novo
  - novo src/ui/price-block.tsx  # novo
---

## O que já está feito (não refazer)

Confirmado por leitura de `src/app/globals.css:191-194`: os 4 tokens de cor do Canvas que **não**
estão marcados `[CONFIRMAR]` em `prompts/00-CONTEXT.md` §3 já existem, com os valores exatos:

```
--editorial-paper: #f7f4ef;   /* papel */
--editorial-ink:   #0b0b0b;   /* preto */
--editorial-accent:#7a1e22;   /* vinho */
--editorial-beige: #d8d0c4;   /* bege */
```

Não recriar essas variáveis nem os valores. `Fertigo` (`FertigoPro-Regular.otf`) já está em
`public/fonts/` e já é consumido via `--font-editorial-display` / classes `.title-font`,
`.editorial-serif` em `globals.css`.

Os 2 tokens marcados `[CONFIRMAR]` no `00-CONTEXT.md` (`#141210` fundo canvas, `#B3282E` vinho
claro/ação) continuam sem valor confirmado — não inventar um hex para eles; se precisar de um
"vinho de ação" mais claro para hover/focus, usar `color-mix` ou opacidade sobre
`--editorial-accent` em vez de cravar um novo literal.

## Escopo real deste prompt

1. **`border-radius: 0` como default público.** Hoje `globals.css:189` ainda define
   `--radius: 0.5rem` no `:root`. A maioria dos componentes públicos já neutraliza isso com
   `rounded-none` inline (confirmado em `product-card.client.tsx`, nav, footer), mas o token base
   continua incoerente com a especificação. Ajustar o `--radius` do escopo público sem quebrar o
   admin, que pode manter cantos arredondados (`00-CONTEXT.md` §3: "admin pode manter cantos retos
   também, mas não é o foco"). Preferir uma variável dedicada (ex.: `--radius-public: 0`) aplicada
   via seletor de área pública, em vez de zerar `--radius` global e quebrar `rounded-xl` do admin
   sem querer — confirmar primeiro se algum componente admin depende do `--radius` global antes de
   tocar nele.
2. **`Button` com os 3 tamanhos do Canvas.** `src/ui/shadcn/button.tsx` hoje só tem
   `default(h-9)/sm(h-8)/lg(h-10)/icon`. Adicionar variantes de tamanho `56/48/44` (nomes sugeridos:
   `xl`/`lg`/`default` ou renomear — escolher nomenclatura que não quebre os ~40+ usos existentes de
   `size="default"`/`size="lg"` no repo; rodar `grep -rn 'size="lg"\|size="sm"' src/` antes de decidir
   os nomes finais). Não obrigar toda a área pública a migrar para o componente `Button` neste
   prompt — muitos CTAs públicos já são `<YnsLink>`/`<button>` com classes ad-hoc (`min-h-11`,
   `min-h-12`) que já batem visualmente com os alvos de 44/48px; documentar isso em vez de reescrever
   dezenas de arquivos que já estão corretos visualmente.
3. **`Field` (52px) como componente isolado.** Confirmado que não existe
   (`find src -iname "field.tsx"` vazio) — hoje é `input.tsx` + `label.tsx` soltos. Criar
   `src/ui/shadcn/field.tsx` compondo os dois com altura `52px`, borda reta, foco em
   `--editorial-accent`. Não migrar todos os formulários existentes neste prompt — só criar o
   componente e usá-lo em 1-2 lugares de prova (ex.: newsletter do footer) para validar a API antes
   de propagar.
4. **`PriceBlock` como componente isolado.** Confirmado que não existe
   (`find src -iname "price-block*"` vazio) — hoje é a classe `.price-font` aplicada ad-hoc em cada
   lugar que mostra preço (`product-card.client.tsx`, PDP, carrinho, checkout). Criar
   `src/price-block.tsx` (ou `src/ui/price-block.tsx`) que recebe `amount`/`compareAt`/`currency`/
   `locale` e usa `.price-font` internamente, preservando o comportamento visual atual (a fonte já
   é `--font-editorial-display`, não mexer nisso). Trocar os usos existentes de preço formatado por
   este componente é desejável mas pode ficar para os prompts que já tocam cada tela (03, 06, 07) em
   vez de forçar aqui uma varredura grande.

## Bloqueio: fonte `DCCAsh`

`prompts/00-CONTEXT.md` §2 e §3 confirmam: `public/fonts/` só tem `FertigoPro-Regular.otf` e
`RubikDistressed-Regular.ttf`. `DCCAsh` (prevista para numerais/preço, `.price-font`) não está no
repo. **Não substituir por uma fonte parecida sem aprovação** — `00-INDEX.md` divergência 4 já
proíbe isso explicitamente. O componente `PriceBlock` deste prompt deve nascer usando
`--font-editorial-display` (Fertigo, o que já está em produção) e ficar pronto para trocar de fonte
no dia em que `DCCAsh.otf` chegar — não bloquear o resto do prompt por causa disso.

## Critérios de aceite

- [ ] `yarn lint` e `yarn build` passam.
- [ ] `--radius` público efetivamente `0` em pelo menos 3 telas verificadas visualmente (home, PDP,
      carrinho) sem quebrar cantos arredondados do admin.
- [ ] `Button` expõe os 3 tamanhos com nomes documentados no próprio arquivo (comentário) e pelo
      menos um uso real de cada tamanho em algum lugar do público.
- [ ] `Field` existe, tem 52px de altura, é usado em pelo menos um formulário real.
- [ ] `PriceBlock` existe, é usado em pelo menos um lugar real, preço renderiza igual ao que
      renderiza hoje (visualmente).
- [ ] Nenhum valor novo de cor hex introduzido para os tokens `[CONFIRMAR]` — se precisar de um tom
      mais claro de vinho, usar `color-mix()`/opacidade sobre `--editorial-accent`.
- [ ] Atualizar `prompts/PROGRESS.md` (o arquivo antigo, na raiz — ele já é o ponto de log
      combinado entre as duas gerações de prompt) com o que foi tocado.

## O que não fazer

- Não inventar valor para `#141210` ou `#B3282E`.
- Não trocar `DCCAsh` por outra fonte.
- Não migrar todos os botões/campos existentes para os novos componentes — só criar + validar com
  poucos usos reais.
- Não zerar `--radius` global se isso quebrar componentes do admin sem uma variável separada para
  o escopo público.
