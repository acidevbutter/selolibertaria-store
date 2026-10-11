# Selo Libertária — Design System

Sistema visual da **Selo Libertária**, editora e produtora cultural de São Paulo dedicada à
literatura erótica, à performance e aos encontros. Publica livros, edições sonoras, zines e
objetos, e produz saraus (Sarau Safado) e laboratórios de escrita.

Este sistema cobre a **loja online multicategoria** — o produto onde o selo vende livro, edição
sonora, zine, objeto, ingresso e laboratório lado a lado, com checkout próprio de três etapas.

## Fontes deste sistema

| Fonte | O que forneceu |
| --- | --- |
| `Canvas Selo Libertaria.dc.html` (turno 2, "Sistema corrigido") | **Ground truth.** Home, /loja, PDP, carrinho, checkout desktop e mobile, componentes fechados e elementos de pagamento. Todos os valores aqui vieram deste turno. |
| `Canvas Selo Libertaria.dc.html` (turno 1, "Mapa de estrutura") | Auditoria do site atual — usada só para saber o que o sistema **corrige**, nunca como referência visual. |
| `assets/fonts/`, `assets/img/` | Arquivos reais de fonte, capas, ilustrações e ícones de pagamento já presentes no projeto. |
| `selolibertaria-store` (pasta local, Next.js) | **Não acessível no momento da extração** — a pasta estava desconectada. Nenhum valor foi lido do código; o canvas cobriu o vão. Ao reconectar, vale conferir tokens do Tailwind contra `tokens/`. |

## Índice

- `styles.css` — ponto de entrada; só `@import`.
- `tokens/` — `fonts`, `colors`, `typography`, `spacing`, `controls` (loja) e `admin` (Oficina v2).
- `components/` — loja: `actions`, `forms`, `commerce`, `navigation`, `payment`, `sections`, `admin` (v1);
  painel: `oficina`, `editor`, `blocks`.
- `guidelines/` — 17 cards de fundação da loja (Colors, Type, Spacing, Brand) + 11 cards do painel
  (Oficina, Blocos) + `admin-design-system-v2.md`, a spec escrita do painel.
- `ui_kits/loja/index.html` — loja click-through: home → catálogo → produto → carrinho → checkout.
- `ui_kits/oficina/index.html` — painel click-through: busca ⌘K, menu em três grupos, listas, editor de blocos, biblioteca e pedidos.
- `assets/` — fontes, imagens de produto, ilustrações, logo e ícones de pagamento.
- `SKILL.md` — versão portátil para Claude Code.

### Componentes

| Grupo | Componentes |
| --- | --- |
| actions | `Button`, `Chip`, `SocialAuthButton` |
| forms | `Field`, `QuantityStepper` |
| commerce | `ProductCard`, `PriceTag`, `MiniProductRow`, `CartLine`, `OrderSummary`, `FreeShippingMeter`, `ShippingOption`, `TrustList` |
| navigation | `SiteHeader`, `CategoryBar`, `Breadcrumb`, `CheckoutStepper`, `SiteFooter` |
| payment | `PaymentMethodTabs`, `CardBrandRow`, `InstallmentList`, `PixPanel`, `BoletoPanel`, `CouponField`, `SavedCard`, `PaymentState` |
| sections | `PageHero`, `SectionHead` |
| admin (v1, loja) | `AdminSidebar`, `MetricCard`, `DataTable`, `OrderStatusChip` |
| oficina (v2, painel) | `ShellSidebar`, `ShellTopbar`, `ShellSearchField`, `LoadingBar`, `DeskBreadcrumb`, `DeskPageHeader`, `DeskRow`, `DeskButton`, `DeskField`, `SheetCard`, `StateBadge`, `ActionFooter`, `EmptyState` |
| editor (v2, painel) | `EditorToolbar`, `BlockFrame`, `BlockToolbar`, `DropGuide`, `BlockPicker`, `BlockOutline`, `ShapePicker`, `InsertRow`, `DropZone`, `CropArea`, `CropOverlay`, `LockedBar`, `MediaPlaceholder` |
| blocks (conteúdo) | `ContentDoc` + `HeadingBlock`, `ParagraphBlock`, `ListBlock`, `QuoteBlock`, `HighlightBlock`, `ImageBlock`, `GalleryBlock`, `ButtonBlock`, `DividerBlock`, `ProductShelfBlock`, `AgendaBlock` |

O inventário é exatamente o que o canvas define. Nada de Toast, Avatar, Tabs ou Modal genérico —
se não está nas telas, não existe aqui.

**Adições intencionais:** o grupo `admin` e o `SocialAuthButton`, vindos do canvas da área logada
(`Canvas Admin Selo Libertaria.dc.html`, turno 2). Cada um existe porque aparece numa tela real de
`/admin`, `/user` ou `/login` — não há componente de painel genérico aqui.

---

## FUNDAMENTOS VISUAIS

### Paleta

Sete cores, sem escala de cinza. Sombra e cinza de biblioteca são proibidos — profundidade vem de
troca de superfície (papel → preto → bege), não de elevação.

| Token | Hex | Papel |
| --- | --- | --- |
| `--sl-paper` | #F7F4EF | fundo público padrão |
| `--sl-paper-pure` | #FFFFFF | só cartão e campo sobre papel |
| `--sl-ink` | #0B0B0B | header, hero, painel de compra, botão padrão |
| `--sl-charcoal` | #141210 | mesa de trabalho (canvas), atrás das telas |
| `--sl-sand` | #D8D0C4 | faixa de filtros, resumo, moldura de imagem, progresso |
| `--sl-wine` | #7A1E22 | **a voz**: links, ✓, estoque, erro, cupom, carrinho |
| `--sl-red` | #B3282E | **a compra**: botão de 56px, badge de lançamento, nav ativa |

**Regra dura:** no máximo duas cores de fundo por página, alternando papel → preto → bege.
Vinho e vermelho nunca trocam de função. Contraste mínimo 4.5:1 em corpo e estados.

Cinzas não existem como cor: são preto ou papel em opacidade (.14 / .20 / .30 para filete,
.55–.72 para texto). Isso mantém tudo dentro da temperatura quente do papel.

### Tipografia

Duas serifas, nenhuma sem-serifa.

- **Fertigo Pro** — manchete. Sempre CAIXA-ALTA, peso 900 (sintético sobre o Regular),
  tracking −.05em, entrelinha .84–.98. Escala: 96 / 76 / 60 / 56 / 44 / 40 / 36.
- **DCC Ash** — display de fantasia. Só preço, número, contador e título curto de bloco
  ("Sobre a edição", "Carrinho · 3 itens"). Escala: 44 / 40 / 30 / 28 / 22 / 18.
- **Corpo** também em Fertigo, caixa normal: 17 lead / 16 corpo / 15 / 14 / 13 apoio,
  entrelinha 1.7–1.8, medida máxima de 60ch (44ch no lead do hero).
- **Micro-label** 10–11px, peso 900, caixa-alta, tracking .20–.34em. Quanto menor o corpo, maior o
  tracking. Nunca abaixo de 10px.

Preço nunca em Fertigo; manchete nunca em DCC Ash. Trocar as duas é o erro mais fácil de cometer.

### Forma, borda, sombra

- `border-radius: 0` em **tudo** na área pública — botão, campo, cartão, imagem, badge, barra de
  progresso. O canto reto é a assinatura. Qualquer `rounded` herdado é bug, inclusive em login e contato.
- Filete de 1px em quatro pesos (14% / 20% / 30% / 100% de tinta). Nenhuma borda colorida.
- **Sem box-shadow decorativa.** A única sombra do sistema é o halo de foco:
  `0 0 0 2px rgba(122,30,34,.20)`.
- Sem blur, sem transparência de vidro, sem gradiente. O único gradiente do sistema é o padrão
  xadrez do placeholder de QR Code.

### Layout

- Larguras de trabalho: 1440 (home/loja), 1152 (PDP/checkout), 416 (carrinho), 390 (mobile).
- Margens: 48 desktop, 40 estreito, 16 mobile. Grade de produto: 4 colunas com gap 20
  (2 colunas com gap 12 no mobile).
- Imagem de produto **sempre 1:1** — é o que faz o mesmo cartão servir capa, pôster, objeto e
  ingresso. Só a imagem principal da PDP é 4:3.
- Mobile fixa uma barra de compra no rodapé (preço + botão de 52px).
- Alturas de controle: 56 compra · 52 campo · 48 botão · 44 alvo mínimo · 26 chip · 24 badge.

### Movimento e estados

- Transições de 120ms lineares em cor e fundo. Sem easing dramático, sem bounce, sem entrada
  animada, sem parallax. A página aparece pronta.
- **Hover:** botão escurece 10–15%; secundário ganha fundo bege; cartão troca o filete de 14%
  para preto sólido. Nunca elevação, nunca escala.
- **Press:** sem transformação — só o tom mais escuro.
- **Foco:** borda preta sólida + halo vinho de 2px. Visível sempre, inclusive por teclado.
- **Selecionado:** bloco sólido (preto ou vermelho), não cor de fundo suave.
- **Erro:** vinho sobre lavagem 6%, com rótulo em vinho e uma frase de saída. Erro sem ação é bug.
- Duas barras de progresso no sistema inteiro: frete grátis (vinho sobre bege) e "Processando"
  (vermelho sobre preto). Nenhuma delas anima sozinha.

### Imagem

Capas e fotos de produto recortadas em 1:1 sobre bege; ilustrações do selo são figurativas,
eróticas e de traço alto-contraste. Nada de foto de banco de imagens, nada de mockup 3D genérico,
nada de pessoa sorrindo em escritório. Quando falta imagem real, o quadro bege vazio é uma
resposta melhor do que um placeholder cinza.

---

## FUNDAMENTOS DE CONTEÚDO

**Voz:** primeira pessoa do plural, direta, sem eufemismo comercial. O selo fala como quem
publica, não como quem vende. Nunca "nós da equipe", nunca exclamação, nunca emoji.

**Caixa:** manchete e micro-label em CAIXA-ALTA; corpo em caixa normal. Títulos de obra respeitam
a grafia publicada — *little fish, big fish* fica minúsculo até dentro de uma manchete caixa-alta
quando é assim que a capa traz.

**Concretude acima de garantia.** Toda promessa vem com prazo, nome do serviço e consequência:

- "Envio em até 2 dias úteis após 12 set, com rastreio pelo Melhor Envio."
- "Troca ou devolução em até 7 dias após o recebimento."
- "Pagamento processado pelo Mercado Pago — não guardamos dados de cartão."
- "Nada foi cobrado. Tente outro cartão ou pague por Pix — o carrinho fica salvo."

Nunca "compra 100% segura", "melhor preço", "aproveite", "corra".

**Rótulo carrega a consequência, não só o nome:** "Pix · Aprovação imediata", "Boleto · Vence em
3 dias", "PAC · 5 dias úteis". Categoria de item carrega a variante: "Ingresso · 14 set",
"Objeto · serigrafia".

**Números:** R$ com espaço e vírgula decimal (R$ 213,90). Datas curtas em minúsculas
("12 set", "14 set · 20h"). Prazos sempre em dias úteis.

**Copy editorial** (manifesto, descrição de obra) pode ser lírica e sensorial — é literatura.
**Copy transacional** (checkout, frete, erro) é seca e literal. As duas nunca se misturam na
mesma frase.

---

## ICONOGRAFIA

Este sistema é quase sem ícones, e isso é deliberado: a hierarquia é tipográfica.

- **Glifos Unicode**, em texto, na cor herdada: `⌕` busca · `✕` fechar · `−` `+` quantidade ·
  `✓` confirmação (sempre vinho) · `▾` select · `Ⓐ` conta.
- **Um SVG inline:** o cadeado do header de checkout, traço de 1.6px em papel.
- **Ícones de pagamento** em `assets/img/icons/`: `pix.svg`, `visa.svg`, `mastercard.svg`,
  `mercado-pago.svg`. Sobre preto vão com `filter: invert(1) brightness(2)`.
- **Bandeiras sem arquivo** (Elo, Amex, Hiper, Boleto) são **wordmark em caixa reta**, nunca logo
  reconstruído — decisão explícita do canvas: sobrevive à paleta e não falsifica marca alheia.
- Outros ícones no projeto: `instagram.svg`, `devbutter.svg` (rodapé/crédito).
- **Sem emoji. Sem biblioteca de ícones. Sem SVG desenhado à mão.** Se um novo ícone for
  necessário, traga o arquivo real.

---

## O QUE ESTE SISTEMA CORRIGE

Registrado aqui porque é o motivo de ele existir (canvas, turno 2a e 2e):

1. Zero `border-radius` na área pública.
2. Um cartão de produto para home, catálogo, busca e relacionados.
3. Campo editorial de 52px; botões de 56 / 48 / 44.
4. Frete calculado antes do checkout — o total nunca muda.
5. "Livros" sai da nav; entram seis categorias com contador.
6. Checkout de três etapas com resumo persistente (prazo, troca, rastreio).
7. `PageHero` único para loja, projetos, sarau, sobre, contato e FAQ.

### Área logada (canvas admin, turno 2 — bugs verificados contra o Next.js)

8. **#6** Todo número do painel em DCC Ash; o título da página volta para 60px / 36px mobile.
9. **#7** Badge de status na paleta do selo: bege/vinho, tinta 6%, preto sólido, lavagem vinho. Fim do verde e do âmbar de biblioteca.
10. **#8** Tabela compartilhada com filete em tinta transparente (14% / 20%), raio zero, hover em tinta 4% com filete sólido, vazio em quadro bege com frase de saída.
11. **#9** Sidebar em raio zero e item selecionado como bloco sólido vinho.
12. Login social entra no `/login` como ação secundária, com ícone oficial do provedor.

**Decisões registradas (2026):** raio zero também no painel, sem token de exceção · login social
aprovado · consolidação de `/user` + `/orders` **no backlog**, IA inalterada por ora · cartão
"Falhas" clicável **em aberto** — desenhado, não aprovado.

---

## Notas de implementação

Os componentes são JSX presentacional puro que lê os custom properties de `styles.css` — sem
CSS-in-JS, sem dependência de npm, sem estado. Um consumidor precisa de duas coisas: linkar
`styles.css` e copiar `assets/fonts/`.

Os cards de `guidelines/` e `components/` são HTML estático com os mesmos valores dos tokens
(não montam o bundle React), então renderizam em qualquer contexto, inclusive fora do compilador.

---

## O PAINEL É OUTRO SISTEMA — OFICINA v2

Decidido em 13 set 2026, executado com o turno 4 (editor de páginas). A **loja não muda**: tudo que é
público segue os `--sl-*`. Dentro de `/admin` vale o que está aqui e em
`guidelines/admin-design-system-v2.md` (a spec longa, com os aceites do turno).

**Tese:** o admin não é uma página do site, é uma oficina. Duas metades declaradas —
**casca de tinta** (onde você navega) e **mesa de papel** (onde você trabalha). Onde a loja resolve
profundidade em filete, aqui a hierarquia é de material. Três superfícies por tela, nunca uma quarta:
casca `#0B0B0B` → mesa `#EFEAE2` → folha `#FFFFFF`.

Herdado da loja sem discussão: raio zero, sem sombra decorativa, transição 120ms linear,
foco = filete tinta + halo vinho `0 0 0 2px rgba(122,30,34,.20)`, escrita direta em português.

### Cores (tokens em `tokens/admin.css`)

| Token | Hex | Papel |
| --- | --- | --- |
| `--ad-shell` | #0B0B0B | rail e topbar |
| `--ad-shell-2` | #1F1A16 | busca, menu de conta, moldura de recorte |
| `--ad-on-shell` | #F7F4EF | texto e logo sobre a casca |
| `--ad-selected` | #7A1E22 | item de nav selecionado — bloco sólido |
| `--ad-signal` | #B3282E | barra de carregamento **sobre escuro**, nunca texto |
| `--ad-desk` | #EFEAE2 | mesa de trabalho |
| `--ad-sheet` | #FFFFFF | folha — o único branco do painel |
| `--ad-paper` | #F7F4EF | prévia de conteúdo público dentro do editor |
| `--ad-sand` | #D8D0C4 | barra de ferramentas, rodapé de ação, cabeçalho de tabela |
| `--ad-wine` | #7A1E22 | ação, link, seleção, linha-guia, erro |

**Regras duras:** vermelho só sobre escuro, vinho só sobre papel · cinza não existe (tinta ou papel em
opacidade) · nenhuma borda colorida além do vinho.

### Tipografia

Duas famílias. **DCC Ash não existe no admin** — display de fantasia atrasa leitura de dado.

- **Fertigo** — título e corpo. Título CAIXA-ALTA 900, `-.04em`, entrelinha .92.
- **IBM Plex Mono** — **todo dado**: id, data, hora, valor, contagem, dimensão, nome de arquivo,
  tamanho, atalho, nome de tipo no schema, rótulo de grupo. `tabular-nums` sempre; valor à direita.
- Escala: 36 tela (28 mobile) · 24 seção · 18 cartão · 17 folha do editor · 15 corpo · 13 apoio ·
  11 micro-label (900 / .22em / caixa-alta) · mono 13 dado · mono 12 linha secundária · mono 10 grupo.

### Alturas e medidas

56 topbar · 48 linha de lista · 44 campo, botão e item de sidebar · 36 botão de ferramenta ·
28 chip e barrinha de bloco · 24 badge · 2 carregando. Rail 264 · folha do editor **780**
(a medida da coluna publicada) · índice de blocos 230 · menu de inserir 360 · busca 380.

### Casca — navbar e menu lateral

- **Topbar de 56px:** busca global à esquerda (34px sobre `--ad-shell-2`, glifo `⌕`, atalho `⌘K` em
  mono), `Ver o site ↗` e quadrado papel de 28px com as iniciais. Ações de página **não** ficam aqui.
- **Rail de 264px, três grupos:** Conteúdo (Páginas, Eventos, Projetos, Imagens) · Operação (Pedidos,
  Produtos, Promoções, Clientes) · Sistema (E-mails enviados, Modelos de e-mail, Pagamentos recebidos,
  Configurações). Rótulo de grupo em mono 10 / .22em / papel 55%.
- Item de 44px sangrando até a borda; **selecionado = bloco sólido vinho** em caixa-alta 900;
  hover e rota-pai em papel 6%; contagem em mono 11. Subrota marca o **item**, nunca o grupo.
- **Carregando:** barra de 2px em `--ad-signal` no topo da mesa + item clicado em hover.
  **Nunca overlay preto** — a tela anterior fica legível até a nova chegar.
- Busca global abre painel sobre a casca escurecida, resultados agrupados em mono, `esc` fecha.

### Itens e blocos

O conteúdo de uma página é um **documento de nós** (`contentDoc`, jsonb), nunca HTML livre, com
**11 tipos fechados**: `heading | paragraph | list | quote | highlight | image | gallery | button |
divider | productShelf | agenda`. Tipo fora da lista devolve **422**.

Um **renderer único** (`components/blocks/ContentDoc.jsx`) percorre o documento na prévia do admin e
na página pública — é isso que faz "ver como fica" ser verdade. Nenhum nó carrega estilo próprio e
nada passa por `dangerouslySetInnerHTML`. Em modo edição cada nó emite `data-node-id`.

**Imagem tem quatro formas nomeadas** — `wide` (padrão de quem arrasta), `side` (com botão de virar,
empilha no celular), `center` (retrato, capa, documento), `gallery` (3 a 6 fotos). Nunca largura em
pixel, nunca canto arrastável: canto livre produz página que quebra no celular. O recorte grava um
`cropId` no nó — o arquivo original fica intacto na biblioteca.

**Chrome de bloco:** barrinha de 28px em tinta no canto superior direito, em hover, com o tipo do nó
e as ações em mono (`Recortar · Trocar · Legenda · Mover ⇅ · Remover`; bloco de texto mostra
`Mover ⇅ · Duplicar · Remover`). Linha-guia de arraste: 2px vinho na largura da coluna com etiqueta
`solta aqui` — só entre blocos, nunca no meio de uma frase, e o **único elemento animado do editor**.

**Liberdade de estrutura, não de estilo.** A editora insere, reordena, duplica, apaga, recorta e
publica. Ela não troca fonte, cor, tamanho ou espaçamento, não define largura em pixel e não cola HTML
com estilo embutido. Nenhum controle de estilo é exposto ao editor de conteúdo.

### Conteúdo no painel

Mesma voz da loja, ainda mais seca: rótulo carrega a consequência, estado vazio oferece a saída, erro
diz o que fazer **e o que não se perdeu**. "Rascunho salvo às 14:32 — só vai ao ar quando você
publicar." · "A imagem 2 não terminou de subir. O rascunho está salvo às 14:32 — tente publicar de
novo." · "Esta página ainda não tem blocos. Comece por um Título." · "Alguém publicou esta página às
14:10. Veja o que mudou antes de publicar por cima."

### Onde está aplicado

- `ui_kits/oficina/index.html` — painel inteiro sobre a casca nova (5 telas migradas; as demais
  mostram a casca nova com aviso de migração).
- `Canvas Admin Turno 4 - Editor.dc.html` — origem do sistema, turno 4 completo.
- `components/admin/` (v1) fica como registro da área logada antiga; dentro de `/admin` o que vale é
  `oficina` + `editor` + `blocks`.
