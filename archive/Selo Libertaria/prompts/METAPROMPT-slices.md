# META-PROMPT — gerar os arquivos de prompt por slice (Loja Selo Libertária)

Cole este texto inteiro como **primeira mensagem** para um agente de código (Claude Code, Codex CLI, Cursor) com acesso ao repositório da loja e ao canvas de design. Ele **não implementa nada**: ele produz a pasta `prompts/` com um arquivo de prompt por slice, já com modelo recomendado, contexto mínimo e critérios de aceite.

---

## 0. Papel

Você é o *tech lead de entrega* deste projeto. Sua única saída neste turno são **arquivos de prompt em Markdown**. Nenhum código de produção, nenhum refactor, nenhum commit em `src/`.

## 1. Entradas

| O que | Onde | Como ler |
|---|---|---|
| Design aprovado (fonte da verdade visual) | `Canvas Selo Libertaria.dc.html` — seção `2a…2f` (proposta corrigida). As seções `1a…` são o diagnóstico antigo: só contexto, não implementar. | Nunca leia o arquivo inteiro (≈340 KB). Use `grep` por `data-screen-label` e leia **faixas de linhas** de 80–200 linhas por vez. |
| Código atual | repo Next.js App Router: `src/app/(store)/page.tsx`, `/products`, `/product/[slug]`, `CartSidebar`, `/checkout` (Mercado Pago), `/login`, `/user`, `/admin` | `ls` + `grep` por nome de componente antes de abrir arquivo. |
| Fontes e imagens | `assets/fonts/DCC-Ash.otf`, `assets/fonts/FertigoPro-Regular.otf`, `assets/img/` | copiar, não referenciar de fora. |

## 2. Fase A — um único passe de descoberta (barato)

Antes de escrever qualquer prompt, produza **`prompts/00-CONTEXT.md`** (máx. 300 linhas). Ele existe para que nenhum prompt de slice precise redescobrir o projeto. Deve conter, extraído do código e do canvas — sem prosa:

1. **Stack real**: versões (Next, React, Tailwind?, CSS Modules?, ORM, provider de pagamento), scripts de `package.json`, comandos de lint/test/build.
2. **Convenções**: onde ficam componentes, server vs client components, padrão de data fetching, i18n/moeda, tratamento de erro.
3. **Tokens travados** (copiar do canvas, valores literais):
   - Cores: `#0B0B0B` preto, `#141210` fundo canvas, `#F7F4EF` papel, `#D8D0C4` bege, `#7A1E22` vinho, `#B3282E` vinho claro/ação.
   - Tipografia: `DCCAsh` (numerais/preço), `Fertigo` (títulos e corpo). Escala: hero 96/60/40 · seção 56 · card 22 · corpo 16/1.7 · micro-label 10–11 uppercase `letter-spacing:.24em`.
   - Geometria: **`border-radius: 0` em toda a área pública**. Campo editorial 52px. Botões 56 / 48 / 44px. Alvo mínimo mobile 44px. Imagem de produto **1:1**.
   - Fundo: no máximo 2 cores por página, alternando papel → preto → bege. Contraste mínimo 4.5:1.
4. **Mapa de telas → arquivos**: tabela `tela | id no canvas | linhas | rota | arquivos que mudam`.
5. **Inventário de componentes fechados** (existem uma vez só): `Nav`, `Footer`, `ProductCard`, `Button` (3 tamanhos), `Field` (52px), `Badge/Tag`, `PriceBlock`, `CategoryFilterBar`, `CartLine`, `OrderSummary`, `AccordionStep`, `PaymentMethodTile`, `TrustRow`.
6. **Regras de negócio da loja**: categorias = Livros, Edições sonoras, Zines & impressos, Objetos, Ingressos, Laboratórios. Nav e footer dizem "Loja", não "Livros". Frete calculado **no carrinho, antes do checkout** — o total não muda depois.

## 3. Fase B — fatiar

Regras de corte:

- **Um slice = um PR mergeável** que deixa o site funcionando. Nunca um slice que só compila junto com o seguinte.
- **Ordem por dependência**, não por importância: fundação (tokens/primitivos) → shell (nav/footer) → componentes compartilhados → páginas → fluxos com estado → pagamento → editoriais → conta/admin → QA.
- **Máx. ~6 arquivos tocados e ~400 linhas alteradas por slice.** Se estourar, quebre em `04a`, `04b`.
- Cada slice declara explicitamente **o que NÃO é dele** (para o agente não “melhorar” vizinhos).
- Nenhum slice reescreve o design system; slices posteriores só **consomem** os primitivos do slice 01.

Sequência-base (ajuste se o código pedir, e justifique em uma linha no índice):

| # | Slice | Depende de | Canvas |
|---|---|---|---|
| 01 | Fundação: tokens, fontes locais, reset `radius:0`, `Button`, `Field`, `Badge`, `PriceBlock` | — | 2a, 2e |
| 02 | Shell: `Nav` (busca, carrinho com contador) + `Footer`, rota `/loja` e renomeações | 01 | 2b, 2e |
| 03 | `ProductCard` único + `CategoryFilterBar` (usado em home, catálogo, busca, relacionados) | 01 | 2b, 2e |
| 04 | Home multicategoria: hero de lançamento + faixa de categorias + "Em destaque" | 02, 03 | 2b |
| 05 | `/loja`: grid, filtros, ordenação, estados vazio/carregando | 03 | 2c |
| 06 | PDP `/product/[slug]`: galeria 1:1, painel de compra, ficha, relacionados | 03 | 2c |
| 07 | Carrinho + **cálculo de frete no carrinho** | 03 | 2d |
| 08 | Checkout: 3 etapas em acordeão + resumo persistente (prazo, troca, rastreio) | 07 | 2d |
| 09 | Elementos de pagamento: cartão, Pix, boleto, cupom, bandeiras, estados de erro/sucesso | 08 | 2f |
| 10 | Editoriais: `/projects`, `/sarau-safado`, `/events`, `/about`, `/contact`, `/faq` | 02 | 1a-… (adaptar ao sistema novo) |
| 11 | Conta e admin: `/login`, `/user`, `/admin` sob o sistema novo | 01, 02 | seção 06 |
| 12 | QA final: contraste 4.5:1, alvos 44px, teclado, `radius:0` residual, LCP/CLS, meta/OG | todos | 2a |

## 4. Formato obrigatório de cada arquivo `prompts/NN-slug.md`

```markdown
---
slice: 04
titulo: Home multicategoria
modelo: <modelo recomendado + por quê em ≤10 palavras>
depende_de: [02, 03]
arquivos_previstos:
  - src/app/(store)/page.tsx
  - src/components/store/HeroLaunch.tsx
canvas: "Canvas Selo Libertaria.dc.html linhas 83–225 (id 2b)"
custo_estimado: baixo | médio | alto
---

## Objetivo
Uma frase. O estado final observável.

## Contexto
Leia `prompts/00-CONTEXT.md` (seções 3 e 4). Não releia o canvas inteiro — apenas as linhas citadas acima.

## Especificação
Tabela/lista de valores literais: espaçamentos, tamanhos, cores, textos, breakpoints, estados (default/hover/focus/disabled/vazio/carregando/erro). Sem adjetivos.

## Fora de escopo
Lista do que não tocar.

## Definição de pronto
- [ ] `npm run build` e lint passam
- [ ] nenhum `border-radius` novo na área pública
- [ ] mobile 390 e desktop 1440 conferidos
- [ ] critério específico do slice
- [ ] atualizar `prompts/PROGRESS.md` com arquivos tocados e decisões

## Se travar
Pare, escreva a dúvida em `prompts/PROGRESS.md` e não invente API nem dado.
```

Regra de ouro: **o prompt do slice carrega a especificação em texto compacto**, não pedaços de HTML do canvas. Traduzir o desenho em números uma vez, no prompt, é o que economiza tokens depois.

## 5. Escolha de modelo (preencha o campo `modelo` de cada slice)

- **Modelo rápido/barato** (Haiku, GPT-mini): renomeações, aplicar token em massa, remover `border-radius`, criar páginas editoriais a partir de um layout já existente, ajustes de copy, checklist de QA mecânico. Slices 02 (parte de renome), 10, 12.
- **Modelo padrão** (Sonnet / equivalente): o corpo do trabalho — componentes, páginas, estados, formulários. Slices 03, 04, 05, 06, 11.
- **Modelo de raciocínio** (Opus / equivalente, com plano antes de codar): decisões que contaminam todo o resto — slice 01 (fundação), 07 (frete: cálculo, cache, edge cases), 08–09 (checkout e pagamento, dinheiro real).
- Escreva a regra prática no índice: *começar o slice no modelo padrão; escalar para o de raciocínio só se o plano do próprio agente indicar mais de 6 arquivos ou mudança de contrato de dados.*

## 6. Economia de tokens — regras que os prompts devem repetir

1. Ler por `grep` + faixa de linhas; nunca abrir arquivo > 1000 linhas por inteiro.
2. Nunca reimprimir um arquivo no chat; usar edição por substituição de string.
3. Não reler o que você mesmo acabou de escrever no mesmo turno.
4. Um turno = todas as leituras em paralelo, depois todas as escritas em paralelo.
5. Terminar cada slice com um resumo de ≤5 linhas em `prompts/PROGRESS.md` — é isso que dá contexto ao slice seguinte, no lugar do histórico da conversa.
6. **Uma conversa nova por slice.** O `00-CONTEXT.md` + `PROGRESS.md` substituem o histórico.

## 7. Saída final deste turno

```
prompts/00-CONTEXT.md
prompts/00-INDEX.md      # tabela dos slices: ordem, modelo, dependência, status
prompts/PROGRESS.md      # criado vazio, com cabeçalho e formato de entrada
prompts/01-fundacao.md
prompts/02-shell.md
… até 12
```

`00-INDEX.md` termina com o **protocolo de execução** em 5 linhas: abrir conversa nova → colar o prompt do slice → agente lê CONTEXT + PROGRESS → implementa → atualiza PROGRESS → PR.

Ao concluir, responda apenas com a lista de arquivos criados e as decisões de fatiamento que divergiram da sequência-base.
