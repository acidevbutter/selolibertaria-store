# Auditoria + prompts — Canvas Selo Libertária (design novo)

Fonte: `Canvas Selo Libertaria.dc.html`, projeto Claude Design `018e9063-10de-4a25-81c9-d51db44f8613`.
Nenhuma sessão até agora (incluindo esta) teve acesso autenticado ao Canvas — o sync exige
`/design-login` interativo, indisponível headless. Esta pasta é uma **auditoria real contra o
código**, feita por leitura de arquivo (não por inferência), para substituir os status genéricos
de `prompts/00-INDEX.md` (que marca as 12 slices como `todo` porque foi montado sem checar o
repo linha a linha).

**Não editar nem apagar `../../prompts/` (pasta antiga na raiz do projeto)** — ela fica como
histórico do primeiro fatiamento. `prompts/00-CONTEXT.md` continua a referência para tokens,
convenções e mapa de arquivos — os prompts abaixo linkam para lá em vez de duplicar.

## Contradição que motivou esta auditoria

`docs/design/userinterface.md` ("Atualização 2026-06-24", linha 176) afirma que **Catálogo,
Projetos, Sarau Safado, Sobre e Contato já devem repetir** a gramática visual do Canvas (hero
dominante, poucas seções, alternância papel/preto, fechamento único antes do footer) — sugerindo
que isso já tinha sido aplicado ~2 meses atrás. `prompts/00-INDEX.md`, gerado há ~40 min sem ler
o código, marca a slice 10 (editoriais) como `todo` do zero.

**Veredito da auditoria: o documento estava certo, o índice estava desatualizado.** `/projects`,
`/sarau-safado`, `/events`, `/about` e `/contact` já implementam a gramática do Canvas — hero em
`--editorial-ink`/`--editorial-paper`, seções alternando papel/preto/bege, CTA de fechamento único
antes do `<Footer />`. A única página realmente pendente é `/faq`, que **nunca foi citada** nessa
atualização (ela lista só Catálogo/Projetos/Sarau/Sobre/Contato) e continua num design antigo
(gradiente vermelho `#220607`/`rgba(220,38,38,...)`, zero tokens editoriais).

## Tabela de auditoria

| Slice (00-INDEX) | Status real | Evidência (arquivo:linha) | Prompt novo |
|---|---|---|---|
| 01 — Fundação (tokens/fontes/Button/Field/Badge/PriceBlock) | **parcial** | Cores já batem: `src/app/globals.css:191-194` (`--editorial-paper:#f7f4ef`, `--editorial-ink:#0b0b0b`, `--editorial-accent:#7a1e22`, `--editorial-beige:#d8d0c4` — os 4 tokens não marcados `[CONFIRMAR]`). `Fertigo` presente em `public/fonts/FertigoPro-Regular.otf`. Faltam: `DCCAsh` ausente de `public/fonts/` (só há `FertigoPro-Regular.otf` e `RubikDistressed-Regular.ttf`); `--radius: 0.5rem` ainda como default em `globals.css:189` (não `0`); `src/ui/shadcn/button.tsx` só tem tamanhos `default/sm/lg/icon` (h-8/h-9/h-10), nenhum 56/48/44; `field.tsx` e `price-block.tsx` não existem em `src/ui/shadcn/` nem `src/ui/` (`find` vazio). | [`01-fundacao-tokens-componentes.md`](./01-fundacao-tokens-componentes.md) |
| 02 — Shell (Nav/Footer) | **quase feito** | `src/ui/nav/nav-menu.tsx:24-29` já usa os 5 links oficiais (Loja/Projetos/Sarau Safado/Sobre/Contato) + CTA de conta separado; `src/ui/nav/nav.tsx` já tem `CartIcon` compacto sem rótulo, caixas retas com borda `--editorial-ink`. `src/ui/footer/footer.tsx` já tem as 3 seções + newsletter + ícones de pagamento. Única pendência: `src/lib/public-navigation.ts` ainda define `shop: "/products"` — rename para `/loja` citado no `00-INDEX` divergência 5 nunca foi feito (decisão de URL/SEO em aberto, não bug). | sem prompt — ver decisão D1 em [`00-decisoes-pendentes.md`](./00-decisoes-pendentes.md) |
| 03 — ProductCard + CategoryFilterBar | **parcial** | `ProductCard` (`src/ui/products/product-card.client.tsx`) já existe, unificado, `rounded-none`, tokens editoriais — mas a imagem usa `aspect-[2/3]` (linha 151), não a proporção `1:1` do token de geometria em `00-CONTEXT.md` §3 (a PDP, em contraste, já usa `aspect-square`). `CategoryFilterBar`: zero ocorrências em `src/` (`grep -rl "CategoryFilterBar" src/` vazio) — bloqueado pela mesma lacuna de dado da linha abaixo. | [`02-product-card-category-filter.md`](./02-product-card-category-filter.md) |
| 04 — Home | **parcial** | `src/app/(store)/page.tsx` já compõe Hero→Manifesto→FeaturedBooks→ProgramGrid na ordem certa; `HomeHero` já suporta `hero.mode === "product"` (hero de lançamento). 4 arquivos de `src/ui/home/` (`home-author-spotlight.tsx`, `home-community-cta.tsx`, `home-immersive-gallery.tsx`, `home-top-bar.tsx`) não são importados em lugar nenhum — código morto, não pendência de UI. Falta: faixa de categorias — nenhuma menção a "category"/"Category" em `src/ui/home/*.tsx`, bloqueada pela mesma lacuna de dado. | [`03-home-faixa-categorias.md`](./03-home-faixa-categorias.md) |
| 05 — `/loja` catálogo | **parcial** | `src/app/(store)/products/page.tsx` já usa `CatalogIntro` com hero escuro dominante + grade única (`ProductList`) + CTA de fechamento em bege antes do footer — bate com a gramática do Canvas. `src/ui/products/product-list.tsx` não tem nenhum controle de filtro ou ordenação (nenhum grep de "filter"/"sort"/"ordenar"). Estados vazio (`page.tsx`, bloco tracejado) e carregando (`products/loading.tsx`) existem. | [`04-loja-filtros-ordenacao.md`](./04-loja-filtros-ordenacao.md) |
| 06 — PDP | **quase feito** | `product-image-gallery.client.tsx:72` já usa `aspect-square` (1:1, bate com o token); painel de compra tem `Comprar` (`page.tsx:258`) e `Ler trecho` (`page.tsx:264`); `Ficha técnica` existe (`page.tsx:353`); relacionados existem via `RelatedBookCard` (`page.tsx:144-391`). Único ponto de atenção: a PDP usa `1:1` mas o `ProductCard` da grade usa `2:3` — mesma decisão pendente da slice 03. | sem prompt — decisão coberta em [`00-decisoes-pendentes.md`](./00-decisoes-pendentes.md) (D2), implementação junto de `02-product-card-category-filter.md` se a decisão for mudar o card |
| 07 — Carrinho + frete | **parcial** | `src/components/cart-sidebar.tsx` já usa tokens editoriais (papel/ink/accent), cupom com feedback, resumo com subtotal/total. Frete **não** é calculado no carrinho: linha ~272 mostra literalmente `"Calculado no checkout"` como placeholder fixo — a cotação real só acontece em `/checkout`. Isso confirma a divergência 3 do `00-INDEX`: é mudança de fluxo, não só de layout. | [`05-carrinho-frete.md`](./05-carrinho-frete.md) (abre com a decisão, não pula direto para código) |
| 08 — Checkout (acordeão) | **todo** | `src/app/checkout/checkout-form.client.tsx` é um wrapper de 15 linhas que só chama `MercadoPagoCheckoutForm`. O formulário real (`mercado-pago-checkout-form.client.tsx:568,637,756`) e a página (`checkout/page.tsx`) usam classes shadcn genéricas (`rounded-xl border bg-background`, `rounded-xl border bg-card`) — zero tokens `--editorial-*`, zero `border-radius:0`. Nenhuma ocorrência de `Accordion`/`Collapsible`/"acordeão" no arquivo — layout é uma coluna única + aside, não 3 etapas. Este é o único slice de tela onde o índice antigo (`todo`) bate exatamente com a realidade. | [`06-checkout-acordeao.md`](./06-checkout-acordeao.md) |
| 09 — Pagamento | **todo** (visualmente) | Pix (QR + copia-e-cola + "Já paguei", `mercado-pago-checkout-form.client.tsx:765-831`) e cartão (Payment Brick, linha 923) já funcionam. Mas: nenhuma ocorrência de "boleto"/"cupom"/"bandeira"/"TrustRow" no arquivo — não existe `PaymentMethodTile` nem `TrustRow` como componentes, e a seção de pagamento herda o mesmo `rounded-xl border bg-background` genérico da slice 08. Nota: `00-CONTEXT.md` §6 confirma Mercado Pago = só Pix + cartão — "boleto" no título original da slice 09 é provavelmente herança de um prompt genérico, não requisito real; não adicionar boleto sem pedido explícito. | [`07-pagamento-elementos.md`](./07-pagamento-elementos.md) |
| 10 — Editoriais | **parcial (1 de 6 páginas)** | `/projects` (`src/app/projects/page.tsx`, íntegra lida), `/sarau-safado`, `/events`, `/about`, `/contact` já batem com a gramática do Canvas — contagem de uso de tokens `--editorial-*`: sarau-safado 15, events 19, about 8, contact 8 ocorrências, todas com hero dominante + CTA de fechamento único antes do `<Footer />` (ex.: `events/page.tsx:309` seção de fechamento em `--editorial-ink`). `/faq` (`src/app/faq/page.tsx`) é a exceção: hero ainda usa `radial-gradient(...rgba(220,38,38,0.46)...)` / `linear-gradient(180deg,#220607...)`, zero tokens `--editorial-*` — design antigo, nunca migrado (e nunca citado como migrado na atualização de 2026-06-24, que lista só 5 páginas). | [`08-editorial-faq.md`](./08-editorial-faq.md) |
| 11 — Conta/Admin | **feito** (nesta profundidade de checagem) | `src/app/login/login-shell.client.tsx` e `src/app/user/page.tsx` já usam tokens editoriais (10 e 7 ocorrências respectivamente). `src/app/admin/layout.tsx:30` já usa `bg-[color:var(--editorial-paper)]` no conteúdo; `src/app/admin/_components/sidebar.client.tsx:54` já usa `bg-[#0b0b0b]` (preto) — bate exatamente com "sidebar preta, conteúdo papel" de `00-CONTEXT.md` §4, e já usa o asset oficial `selolibertaria.png` (linha 26), conforme a atualização de 2026-07-02 do `userinterface.md`. Não foi feita auditoria campo-a-campo de todo formulário do admin — só a casca (shell/sidebar/login/user), que é o escopo do slice. | sem prompt |
| 12 — QA final | **nota, não implementável isolado** | Depende de 08/09 fecharem (checkout ainda genérico) e das decisões D1-D4 em `00-decisoes-pendentes.md`. Não criar prompt de QA agora — reavaliar quando os prompts 05-08 estiverem implementados. | — |

## Ordem de execução recomendada

1. **Decisões primeiro** — `00-decisoes-pendentes.md` (D1 rename `/loja`, D2 aspect-ratio do card, D3 frete no carrinho, D4 escopo de categorias). Nenhum prompt de UI que dependa de uma decisão deve rodar antes dela ser resolvida por alguém do time — mesma disciplina do ADR em `docs/prompts/asaas-payment-integration/`.
2. `01-fundacao-tokens-componentes.md` — bloqueia (fonte `DCCAsh`) mas o que não depende da fonte (radius, Button, Field, PriceBlock) pode andar em paralelo.
3. `02-product-card-category-filter.md`, `03-home-faixa-categorias.md`, `04-loja-filtros-ordenacao.md` — só depois de D4 (categorias) resolvida; sem isso, escopo reduzido a "arrumar aspect-ratio do card" (D2).
4. `05-carrinho-frete.md` — só depois de D3.
5. `06-checkout-acordeao.md` → `07-pagamento-elementos.md` (09 depende de 08).
6. `08-editorial-faq.md` — independente, pode rodar a qualquer momento.
7. Slice 12 (QA) — reavaliar depois dos itens acima, ainda sem prompt próprio.

## Convenções do repo a respeitar (todos os prompts abaixo)

- Next.js 16 App Router, React 19, Server Components por padrão; `.client.tsx` só quando precisa de interatividade.
- Tailwind v4 via `@import "tailwindcss"` em `src/app/globals.css` — sem `tailwind.config.js` clássico, tokens em `@theme` e blocos `:root`/`.dark`.
- Biome: tabs, `indentWidth: 2`, `lineWidth: 110` (`biome.json`). Rodar `yarn lint` antes de considerar pronto.
- Testes com Vitest, colocados ao lado do código (`*.test.tsx`).
- shadcn/ui `style: new-york`; aliases `components→@/ui`, `ui→@/ui/shadcn`, `lib→@/lib` (`components.json`).
- Tokens/geometria/tipografia: não duplicar aqui — ler `prompts/00-CONTEXT.md` §3 antes de qualquer prompt desta pasta.
- Regras de negócio travadas (não mexer sem aprovação explícita, ver `prompts/00-CONTEXT.md` §6 e `AGENTS.md`): checkout convidado, `X-Idempotency-Key` do Mercado Pago, país fixo `BR`, Mercado Pago como único provider.

## O que esta auditoria não cobriu

- Não foi feita checagem campo-a-campo de todos os formulários do admin editorial (só o shell/sidebar/login/user, que é o escopo real da slice 11).
- Não foi feita auditoria de contraste 4.5:1 nem de alvo mínimo 44px pixel-a-pixel — isso é o próprio conteúdo da slice 12 (QA), que continua fora de escopo até as slices anteriores fecharem.
- Sem acesso ao Canvas ao vivo, nenhuma faixa de linha `data-screen-label` foi confirmada — os prompts abaixo continuam trabalhando a partir de `docs/design/userinterface.md` + `docs/design/UI_UX_PATTERNS.md` + inspeção de código, igual à geração anterior.
