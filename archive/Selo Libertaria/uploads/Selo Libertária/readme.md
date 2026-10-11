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
- `tokens/` — `fonts`, `colors`, `typography`, `spacing`, `controls`.
- `components/` — `actions`, `forms`, `commerce`, `navigation`, `payment`, `sections`.
- `guidelines/` — 16 cards de fundação (Colors, Type, Spacing, Brand).
- `ui_kits/loja/index.html` — loja click-through: home → catálogo → produto → carrinho → checkout.
- `assets/` — fontes, imagens de produto, ilustrações, logo e ícones de pagamento.
- `SKILL.md` — versão portátil para Claude Code.

### Componentes

| Grupo | Componentes |
| --- | --- |
| actions | `Button`, `Chip` |
| forms | `Field`, `QuantityStepper` |
| commerce | `ProductCard`, `PriceTag`, `MiniProductRow`, `CartLine`, `OrderSummary`, `FreeShippingMeter`, `ShippingOption`, `TrustList` |
| navigation | `SiteHeader`, `CategoryBar`, `Breadcrumb`, `CheckoutStepper`, `SiteFooter` |
| payment | `PaymentMethodTabs`, `CardBrandRow`, `InstallmentList`, `PixPanel`, `BoletoPanel`, `CouponField`, `SavedCard`, `PaymentState` |
| sections | `PageHero`, `SectionHead` |

O inventário é exatamente o que o canvas define. Nada de Toast, Avatar, Tabs ou Modal genérico —
se não está nas telas, não existe aqui.

**Adições intencionais:** nenhuma.

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

---

## Notas de implementação

Os componentes são JSX presentacional puro que lê os custom properties de `styles.css` — sem
CSS-in-JS, sem dependência de npm, sem estado. Um consumidor precisa de duas coisas: linkar
`styles.css` e copiar `assets/fonts/`.

Os cards de `guidelines/` e `components/` são HTML estático com os mesmos valores dos tokens
(não montam o bundle React), então renderizam em qualquer contexto, inclusive fora do compilador.
