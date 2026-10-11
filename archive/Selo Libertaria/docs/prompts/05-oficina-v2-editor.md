# Fatia 05 — Oficina v2 + Editor do turno 4

**Canvas:** [`Canvas Admin Turno 4 - Editor.dc.html`](../../Canvas%20Admin%20Turno%204%20-%20Editor.dc.html)
**Design system:** [`guidelines/admin-design-system-v2.md`](../../guidelines/admin-design-system-v2.md) — **manda sobre** `admin-design-system.md` em tudo que é `/admin`
**Depende de:** 00 (tokens), 01 (biblioteca de imagem, painel de recorte), 02 (esquema `contentDoc`, renderer único)
**Paralelo com:** 03

Esta fatia é o turno 4 desenhado por inteiro. Ela **não** inventa produto novo: ela fixa o
design system do painel (**Oficina v2**) e leva a fatia 02 do "existe" ao "está desenhado até o pixel".

---

## ⚠️ LEIA ANTES DE ESCREVER A PRIMEIRA LINHA

**O resultado tem de ficar IDÊNTICO ao canvas `Canvas Admin Turno 4 - Editor.dc.html` e ao que está
escrito neste arquivo. Não é inspiração, não é referência solta, não é "no espírito de". É réplica.**

Regras de execução, sem exceção:

1. **Nenhum valor é sugestão.** Todo hex, altura em px, `letter-spacing`, opacidade, ordem de botão,
   rótulo e microtexto deste arquivo é **literal**. Se está escrito `44px`, é 44 — não 40, não 48,
   não `h-11` "que dá quase". Se está escrito `#7A1E22`, é esse — não o vinho aproximado do tema.
2. **Microcópia ao caractere.** Toda frase entre aspas neste arquivo vai para a tela exatamente
   assim, em português, com a mesma pontuação e o mesmo acento. Não reescreva, não "melhore",
   não traduza, não encurte. Isso inclui placeholder, estado vazio, erro e rodapé.
3. **Nada a mais.** Não acrescente ícone, sombra, arredondamento, gradiente, animação, badge de
   status colorido, toast, tooltip, tela intermediária nem controle que não esteja aqui.
   Ausência é decisão de design, não esquecimento.
4. **Nada a menos.** Se um item deste arquivo não couber no sprint, **pare e pergunte** —
   não entregue uma versão simplificada em silêncio.
5. **Abra o canvas ao lado do editor.** Cada seção abaixo aponta o id da tela (`4a`–`4k`).
   Implemente olhando para ela e, ao terminar cada sub-prompt, compare lado a lado antes de commitar.
6. **Em caso de conflito** entre este arquivo, o canvas, a spec v2 e o código existente, a ordem de
   prioridade é: **canvas → este arquivo → `admin-design-system-v2.md` → repo**. Divergência entre
   canvas e este arquivo é bug meu: pergunte em vez de escolher.
7. **Zero `rounded-*` novo, zero cor fora de `tokens/`, zero status verde/vermelho do shadcn.**

Critério de pronto de cada sub-prompt: **um screenshot da tela implementada ao lado da seção
correspondente do canvas, indistinguíveis em cor, altura, tipografia e texto.**

---

## 0. Materiais — importe nesta ordem

```
Importe do projeto de design "Selo Libertaria":

# regra — leia primeiro, vale para todo /admin
guidelines/admin-design-system-v2.md      ← NOVO, substitui o v1 dentro do admin
guidelines/admin-design-system.md         ← v1, continua valendo na loja pública

# tokens (a fonte dos valores; não reescreva hex à mão)
tokens/colors.css
tokens/typography.css
tokens/controls.css
tokens/spacing.css
tokens/fonts.css
assets/fonts/FertigoPro-Regular.otf
assets/img/selolibertaria.png             ← logo do rail da sidebar

# telas desta fatia (referência de design, NÃO copiar para o app)
Canvas Admin Turno 4 - Editor.dc.html     ← 4a … 4k
Fase 2 - Editor de Blocos.dc.html         ← telas originais da fatia 02
Fase 1 - Midia e Imagem.dc.html           ← painel de recorte reaproveitado em 4f

# prompts irmãos
docs/prompts/01-midia-imagem.md
docs/prompts/02-editor-blocos.md
```

**IBM Plex Mono** entra via Google Fonts (pesos 400/500/600) ou self-host. **DCC Ash não é carregada
no bundle do admin.**

Seções do canvas, por id: `4a` sistema · `4b` casca · `4c` editor · `4d` arraste · `4e` formas ·
`4f` recorte · `4g` os 11 blocos · `4h` limite · `4i` estados · `4j` contrato · `4k` edição na página.

---

## 1. O que muda no design system (quebra o v1 de propósito) · canvas `4a`

Quatro rupturas. Tudo o mais é herdado: **raio zero**, sem sombra decorativa, transição `120ms linear`,
foco `1px solid #0B0B0B` + `box-shadow: 0 0 0 2px rgba(122,30,34,.2)`, microtexto em português direto.

### 1.1 Duas metades, três superfícies

| Camada | Token | Hex | Onde |
|---|---|---|---|
| Casca | `--ad-shell` | `#0B0B0B` | rail, topbar, overlay |
| Casca elevada | `--ad-shell-2` | `#1F1A16` | campo de busca, menu de conta, moldura de recorte |
| Sobre casca | `--ad-on-shell` | `#F7F4EF` | texto e logo |
| Mesa | `--ad-desk` | `#EFEAE2` | fundo da área de trabalho — **cor nova** |
| Folha | `--ad-sheet` | `#FFFFFF` | cartão, editor, tabela, campo |
| Papel | `--ad-paper` | `#F7F4EF` | prévia de conteúdo público dentro do editor |
| Bege | `--ad-sand` | `#D8D0C4` | barra de ferramentas, rodapé de ação, cabeçalho de tabela |
| Tinta | `--ad-ink` | `#0B0B0B` | texto, botão principal, estado ativo |
| Vinho | `--ad-wine` | `#7A1E22` | ação, link, seleção, linha-guia, erro |
| Sinal | `--ad-signal` | `#B3282E` | **só sobre escuro**: barra de progresso e marcador. Nunca texto. |

Filetes: `rgba(11,11,11,.12)` folha · `.20` divisor · `.30` campo e botão secundário ·
`rgba(247,244,239,.14)` dentro da casca.

**Máximo três superfícies por tela** (casca → mesa → folha). Nenhuma quarta cor de fundo.
Vermelho `#B3282E` **nunca** sobre papel; vinho `#7A1E22` **nunca** como fundo de área grande.

### 1.2 DCC Ash sai do admin

Todo **dado** em `IBM Plex Mono` com `font-variant-numeric: tabular-nums`: id, data, hora, valor
monetário, contagem, dimensão, nome e tamanho de arquivo, atalho de teclado, nome de tipo no schema,
rótulo de sistema. Peso 400/500; 600 só em total. Valor monetário alinhado à direita.

> Isto **revoga** a regra 3 do `docs/prompts/README.md` ("valor em DCC Ash") dentro de `/admin`.
> Na loja pública nada muda.

Fertigo cobre título e corpo. Título: `900`, `letter-spacing:-.04em`, `line-height:.92`, CAIXA-ALTA.

### 1.3 Escala de tipo do painel

| Papel | px | Observação |
|---|---|---|
| Título de tela | 36 (28 mobile) | 900 / `-.045em` / uppercase |
| Título de seção | 24 | 900 / `-.03em` / uppercase |
| Título de cartão | 18 | 900 / `-.03em` / uppercase |
| Corpo | 15 / `1.7` | |
| Apoio | 13 | |
| Micro-label | 11 | 900 / `.22em` / uppercase |
| Rótulo de grupo (sidebar) | mono 10 | `.22em` / uppercase / papel `.55` |
| Dado em tabela | mono 13 | tabular |
| Dado secundário | mono 12 | tabular |

**Contraste:** nada em papel abaixo de `.55` de opacidade sobre a casca — 10–11px exige 4.5:1 cheio.

### 1.4 Alturas de controle (densidade média)

| Elemento | px |
|---|---|
| Topbar | 56 |
| Linha de lista / tabela | **48** |
| Campo · botão principal · botão secundário | 44 |
| Item da sidebar | **44** |
| Botão de barra de ferramentas | 36 |
| Chip · barrinha do bloco | 28 |
| Badge | 24 |
| Barra de carregando | 2 |

Rail `264px`. Coluna de texto do editor `780px`, centrada na mesa. Padding de folha 20–28. Gap 16.

---

## 2. Sidebar — componente fechado, default de todo canvas novo · canvas `4b`

Escrever **uma vez** (`<AdminSidebar />`) e não redesenhar por tela. **Este é o rail de TODA tela
nova do admin** — copiar como está, sem variação por página, sem "só nesta eu ajusto".

- Rail `264px`, `background:#0B0B0B`, `padding:24px 0`, raio zero.
- Topo, padding `0 28px 6px`: quadrado papel de `44px` (`background:#F7F4EF`, `padding:6px`,
  `box-sizing:border-box`) com `assets/img/selolibertaria.png` em `object-fit:contain`; ao lado o lockup
  **LIBERTÁRIA** (13 / 900 / `.24em` / uppercase) e **PAINEL EDITORIAL** (10 / 900 / `.24em` / `rgba(247,244,239,.55)`).
- Três grupos, rótulo mono 10 / `.22em` / uppercase / `rgba(247,244,239,.55)`, padding `12px 28px 6px`
  (18px de topo nos grupos seguintes):
  - **Conteúdo** — Páginas · Eventos · Projetos · Imagens
  - **Operação** — Pedidos · Produtos · Promoções · Clientes
  - **Sistema** — E-mails enviados · Modelos de e-mail · Pagamentos recebidos · Configurações
- Item: altura `44px`, padding `0 28px`, `15px`, `rgba(247,244,239,.72)`.
  **Selecionado** = bloco sólido `#7A1E22`, texto `#F7F4EF`, `900`, `.04em`, uppercase.
  **Rota-pai / hover** = `rgba(247,244,239,.06)`. Sem marcador redondo, sem ícone, sem bege suave.
- Contagem à direita em mono 11 (`rgba(247,244,239,.5)`; `rgba(247,244,239,.65)` no item selecionado).
- **Subrota acende o item da subrota, não o grupo.** Em `/admin/eventos/14` quem acende é *Eventos*;
  *Páginas* fica em hover fraco para mostrar de onde se veio.
- Rodapé `margin-top:auto`, padding `18px 28px 0`, filete de topo: nome e papel do usuário (13) +
  capability em mono 11.

**Renomeações obrigatórias:** Editorial → **Páginas** · Usuários → **Clientes** ·
Recebimento → **Pagamentos recebidos**. Eventos e Projetos deixam de ser terceiro nível e viram item próprio.

### 2.1 Topbar e navegação

- Topbar `56px` na casca: busca `34px` em `#1F1A16` com filete `rgba(247,244,239,.14)`, placeholder
  "Buscar em todo o painel" e `⌘K` em mono 11 `rgba(247,244,239,.6)`; à direita "Ver o site ↗" e
  avatar quadrado `28px` papel com as iniciais em mono 12.
- **Breadcrumb** na mesa, 13px, acima do título e nunca dentro do cartão: níveis anteriores em
  `#7A1E22`, separador `›` em `rgba(11,11,11,.4)`, nível atual em `#0B0B0B` 900.
- **Fim do overlay preto.** Troca de rota mostra barra de `2px` `#B3282E` no topo da área de conteúdo
  + item clicado em `rgba(247,244,239,.06)`. A tela anterior continua legível até a nova chegar.
  Nenhum spinner cobrindo conteúdo em `/admin`.

---

## 3. Os 11 blocos — o must (canvas `4g`)

Lista fechada, já definida em 02.1. Aqui entra o **desenho** de cada um e a inserção.

| Tipo | Nome na UI | Desenho e limites |
|---|---|---|
| `heading` | Título | H2 e H3 apenas. O H1 é o nome da página e não é editável. |
| `paragraph` | Parágrafo | Negrito, itálico, sublinhado e link inline. 17px / `1.75` na folha. |
| `list` | Lista | Com marcador ou numerada; alterna em um clique sem perder os itens. |
| `quote` | Citação | `border-left:4px solid #7A1E22`, padding-left 20, corpo 21px / `1.5`. |
| `highlight` | Destaque do selo | Bloco `#D8D0C4`, padding 20, eyebrow mono 10 `.22em` em `#7A1E22`. |
| `image` | Imagem | Quatro formas nomeadas (§4), recorte, legenda, `href?`. |
| `gallery` | Galeria | 3 a 6 fotos. Menos de 3 → vira `center`; mais de 6 → recusa com aviso. |
| `button` | Botão | Aponta para produto, evento ou link externo. Estilo do DS, sem escolha de cor. |
| `divider` | Separador | Filete `1px`. Nenhuma variação. |
| `productShelf` | Vitrine de produtos | Títulos escolhidos por busca; preço e estoque vêm do catálogo em tempo de render. |
| `agenda` | Agenda | Eventos publicados; item com data passada desaparece sozinho. |

**Menu do "+":** folha de `360px`, cabeçalho "INSERIR BLOCO" (micro-label) + "digite para filtrar"
em mono 11. Linha de `48px`, padding `0 18px`, nome em 15px à esquerda e **o tipo do schema em
mono 11** à direita (`heading`, `paragraph`, …) — é o que faz o time falar a mesma língua do banco.
Item destacado = bloco `#0B0B0B` / texto papel. Rodapé bege: "Onze tipos. O servidor recusa qualquer
outro com 422."

Inserção por três caminhos, todos no mesmo menu: clique no `+`, atalho de texto no início da linha
(`##`, `-`, `1.`, `>`, `---`) e arraste de arquivo (§5). Tipo fora da lista → **422**, nunca render silencioso.

**Reordenar:** todo bloco sobe, desce, duplica e apaga. **Desfazer em 10 passos**, contador
"10 passos" em mono 11 ao lado das setas `↩ ↪` (refazer desabilitado em `rgba(11,11,11,.35)`).

---

## 4. Barra de ferramentas e barrinha do bloco · canvas `4c`

Barra bege `#D8D0C4`, padding `8px 14px`, filete de base `rgba(11,11,11,.20)`, botões de `36px`,
divisores `1px` de `24px` de altura com `margin:0 4px` entre grupos.

Ordem exata, em quatro grupos:

1. seletor de nível `Parágrafo ▾` (folha branca, filete `.25`)
2. **B** · *I* · U̲ · `Link` — ativo = bloco `#0B0B0B` com texto papel
3. `• Lista` · `1. Numerada` · `Citação`
4. `Destaque do selo` (bloco `#7A1E22`, texto papel, 12 / 900 / `.14em` / uppercase) · `Imagem` · `Botão` · `Separador`
5. à direita (`margin-left:auto`): `↩` `↪` + "10 passos" em mono 11

**Barrinha do bloco** — aparece no hover, `28px`, `#0B0B0B`, texto papel, mono 11, colada no canto
superior direito **dentro** da folha (`top:-14px; right:-1px`), itens separados por `|` em
`rgba(247,244,239,.3)`:

- bloco de imagem: `Recortar | Trocar | Legenda | Mover ⇅ | Remover`
- bloco de texto: `Mover ⇅ | Duplicar | Remover`
- no modo "editar na página" (§7), a barrinha começa com **o tipo do nó** (`paragraph`, `image`).

Bloco em foco recebe filete `1px solid rgba(122,30,34,.45)`. Fim da folha: linha tracejada
`rgba(11,11,11,.25)` + `+` de `28px` e "Clique para inserir um bloco aqui".

**Rodapé de ação** (faixa bege grudada no rodapé da mesa): "Rascunho salvo às HH:MM" em mono 12,
"só vai ao ar quando você publicar" em 14px, e à direita `Voltar ao publicado` · `Ver como fica`
(secundários, 44px) · **`Publicar`** (vinho, 44px). Reaproveitar a barra que o editorial **já tem**.

---

## 5. Arrastar a imagem para dentro do texto (canvas `4d` e `4e`)

O pedido original. Três tempos, nesta ordem:

1. **Pega** — do Finder, da biblioteca de Imagens (fatia 01) ou da área de transferência.
   O caminho velho (colar link) continua existindo; só deixa de ser o único.
2. **Mira** — linha-guia de `2px` `#7A1E22` na largura da coluna de texto, com etiqueta
   `SOLTA AQUI` (mono 10 / `.12em` / uppercase, bloco vinho, `top:-11px`). Aparece **entre** blocos,
   nunca no meio de uma frase. Entra e sai em `120ms` — é o **único elemento animado** do editor.
3. **Solta** — sobe para o servidor do selo, comprime (webp + jpg), cria nó `image` em `layout:"wide"`
   e abre o seletor de forma **no bloco recém-criado**: chips de `28px`
   `Faixa larga | Ao lado | Centralizada | Galeria`, ativo em bloco tinta. `Enter` confirma,
   `Esc` mantém faixa larga. Rodapé em mono 11: "enter confirma · esc mantém faixa larga".

### 5.1 As quatro formas — nomeadas, nunca em pixel

| `layout` | Nome na UI | Comportamento |
|---|---|---|
| `wide` | Faixa larga | Ocupa a coluna inteira. **Padrão** de quem arrasta e não mexe em mais nada. |
| `side` | Ao lado do texto | Esquerda ou direita com botão de virar; empilha sozinha no celular. |
| `center` | Centralizada menor | ~58% da coluna, legenda centrada. Retrato, capa, documento. |
| `gallery` | Galeria | Grade de 3 a 6. Abaixo de 3 vira `center`; acima de 6 recusa. |

Sem largura em pixel e sem arrastar canto livre: canto livre quebra no celular e muda o ritmo a cada
seção. Quatro formas cobrem tudo que o selo publica e nenhuma estraga a grade.

### 5.2 Recortar sem sair do editor (canvas `4f`)

É o painel da fatia 01 **chamado de dentro do editor**, não uma rota nova.

- Escurece a casca em `rgba(11,11,11,.82)` e mantém a folha branca centrada (máx. `760px`).
  Cabeçalho na casca `56px`: "RECORTAR IMAGEM" + `nome.jpg · 3024×4032` em mono 11 + `✕`.
- Esquerda: moldura arrastável (`2px solid #F7F4EF`) sobre a imagem, etiqueta vinho "ÁREA VISÍVEL",
  e sob ela "Arraste a moldura para escolher o que aparece.".
- Direita: **ONDE ESTA IMAGEM VAI APARECER** — chips `28px` com proporção nomeada
  (`Capa do evento · 3:4`, `Faixa larga · 16:9`, `Quadrada · 1:1`) e o aviso
  "O recorte vale **só neste bloco**. A mesma foto em outra página mantém o recorte dela.";
  **DESCREVA A IMAGEM** — campo `44px` + "Serve para leitor de tela e para o Google achar a página.";
  faixa bege com `2,1 MB → 240 KB · webp + jpg · usada em 3 lugares` em mono 12.
- Rodapé bege: "O rascunho não recarrega: você volta com o cursor no mesmo ponto." +
  `Cancelar` · **`Usar este recorte`** (vinho).
- Grava **`cropId`** no nó do bloco. O arquivo original fica intacto na biblioteca — recorte é
  referência, **não** segundo upload.

---

## 6. Estados (canvas `4i`) — microcópia literal

| Estado | O que a tela diz |
|---|---|
| Autosave | Faixa bege, "Salvando…" em mono 12 + barra de progresso vinho de `2px`. Grava só o rascunho, com debounce. Nenhum spinner sobre o texto. |
| Publicando | Badge `Publicando` (bloco tinta/papel) + `14 blocos · 3 imagens` em mono 12. Reescreve `MediaUsage` da página. |
| Falha ao publicar | Badge `Falhou` (lavagem vinho 12% + filete vinho 40%). "A imagem 2 não terminou de subir. O rascunho está salvo às 14:32 — tente publicar de novo." |
| Página vazia | "Esta página ainda não tem blocos. Comece por um Título." — com o menu do `+` já aberto no primeiro clique. |
| Imagem pesada | Acima de 8 MB: "Esta foto tem 14 MB. Podemos reduzir para 2 MB sem perda visível — ou escolha outra." A recusa vem com a alternativa. |
| Conflito de versão | "Alguém publicou esta página às 14:10. Veja o que mudou antes de publicar por cima." Comparação lado a lado; nunca sobrescrever no escuro. |

Badges, todos `24px` / mono 11 / `.12em` / uppercase: **Publicado** bege com texto vinho ·
**Rascunho** filete tinta 30% · **Publicando** bloco tinta/papel · **Falhou** lavagem vinho.

Erro fica na tela com o que fazer e o que **não** se perdeu. Nunca toast que desaparece.

---

## 7. Editar sobre a própria página (canvas `4k`) — **etapa 2**

Viabilidade avaliada: **viável**, porque não é um segundo editor — é a **mesma** árvore do renderer
único (02.2) com uma camada de edição por cima. O formato do documento não muda, logo **não há migração**.

**Duas condições, ambas já na direção da fatia 02:**

1. **Renderer puro** — nenhum bloco mexe no DOM por conta própria; tudo vem de props;
   zero `dangerouslySetInnerHTML` no caminho.
2. **`data-node-id` por nó** no modo edição, para casar clique na tela com nó do `contentDoc`.

**Como roda:** a página real em `?edit=1`, mesma origem, dentro da mesa. Links e botões ficam inertes.
Topbar da casca com o par de chips `28px` **Editar** (ativo, bloco papel/texto tinta) / **Ver** (filete)
e a rota em mono 11.

- **Área travada** — cabeçalho, rodapé, preço e estoque: faixa `#0B0B0B` com rótulo mono 11
  "área travada". Sem hover, sem barrinha.
- **Nó editável** — filete vinho `1px` no hover + barrinha do bloco com o tipo do nó na frente.
- **Bloco de dados** (`productShelf`, `agenda`) e bloco vazio — filete tracejado
  `rgba(11,11,11,.3)` e modo amostra.
- **Lista de blocos** — folha de `230px` à direita da página: linha de `40px`, índice em mono 11
  (`01`, `02`, …), nome do bloco, selecionado em bloco vinho; rodapé bege "Arraste na lista para
  reordenar sem rolar a página."
- Rodapé de ação: "Rascunho salvo às HH:MM" + `Ver sem edição` · **`Publicar`**.

**Custo:** ~1 semana além do editor em coluna, e **somente depois** que o renderer único existir.
**Recomendação: entregar em duas etapas** — primeiro a coluna de `780px` (que já é a medida exata da
página publicada, então o "ver como fica" é fiel), depois a edição na página inteira.

---

## 8. O limite (canvas `4h`) — não negociável

**Pode:** escrever e formatar com os 14 controles da barra; inserir, reordenar, duplicar e apagar
qualquer um dos 11 blocos; subir foto, escolher entre as quatro formas, recortar e descrever;
ver como fica, publicar e voltar ao publicado.

**Não pode:** trocar fonte, cor, tamanho de texto ou espaçamento; definir largura de imagem em pixel
ou arrastar canto livre; colar HTML com estilo embutido (o schema recusa o nó); publicar sem passar
pelo renderer do design system.

Liberdade de **estrutura**, não de **estilo**. É o que separa "mais editável" de "vira outro site em um mês".

---

## 9. Contrato de dados · canvas `4j` (recapitulando 02.1, sem alteração)

```
contentDoc: jsonb        documento de nós, nunca HTML livre
tipos: heading | paragraph | list | quote | highlight | image
     | gallery | button | divider | productShelf | agenda
image: { assetId, cropId, layout, caption, href?, alt }
draftDoc · publishedDoc · publishedAt · updatedBy
PUT …/draft (debounce) · POST …/publish · POST …/revert
permissão: editorial.write
```

Validação com Zod; tipo fora da lista → **422**. A coluna antiga continua viva: o site lê `contentDoc`
quando existe. Migração roda uma vez por página e, se falhar, a página segue servindo o texto antigo.

---

## Sub-prompts

> Cada sub-prompt só está pronto quando a tela implementada e a seção do canvas ficam
> **indistinguíveis** em cor, altura, tipografia, espaçamento e texto. Aceite funcional passando com
> visual diferente do canvas = **não está pronto**.

### 05.1 — Tokens e camadas da Oficina v2
**Fazer:** acrescentar aos tokens as camadas `--ad-shell/#0B0B0B`, `--ad-shell-2/#1F1A16`,
`--ad-desk/#EFEAE2`, `--ad-sheet`, `--ad-paper`, `--ad-sand`, `--ad-ink`, `--ad-wine`, `--ad-signal`;
a escala de tipo do §1.3; as alturas do §1.4. Carregar IBM Plex Mono (400/500/600) e **remover
DCC Ash do bundle do admin**.
**Aceite:** grep por `DCC` em `/admin` = 0. Nenhum hex cru novo em componente — tudo por token.
Layout do admin com no máximo três cores de fundo por tela.

### 05.2 — `<AdminSidebar />` + topbar + breadcrumb
**Fazer:** o componente do §2 com os três grupos, renomeações, item de 44px, selecionado em bloco
vinho, contagem em mono, logo real; topbar de 56px com busca e avatar; breadcrumb na mesa;
barra de rota de 2px `#B3282E` **substituindo todo overlay de carregamento** do admin.
**Aceite:** em `/admin/eventos/14` o item *Eventos* está selecionado e *Páginas* em hover fraco;
nenhum spinner cobre conteúdo em nenhuma rota do admin; a sidebar é **um** componente usado por
todas as telas (grep: nenhuma segunda implementação de rail).

### 05.3 — Menu do "+" com os 11 tipos
**Fazer:** folha de 360px, filtro por digitação, linha de 48px com nome + tipo do schema em mono 11,
rodapé bege do 422; inserção por clique, por atalho de texto (`##`, `-`, `1.`, `>`, `---`) e por arraste.
**Aceite:** os 11 tipos inseríveis pelos três caminhos; um 12º tipo forjado na requisição recebe 422;
o filtro acha "Destaque" digitando `dest`.

### 05.4 — Barra de ferramentas, barrinha do bloco e desfazer
**Fazer:** os 14 controles na ordem e nos grupos do §4; estado ativo em bloco tinta; Destaque do selo
em bloco vinho; barrinha contextual por tipo de bloco; desfazer/refazer com contador de 10 passos.
**Aceite:** reordenar, duplicar e apagar sem código; desfazer volta 10 passos; **nenhum** controle de
fonte, cor, tamanho ou espaçamento existe na interface.

### 05.5 — Arraste com linha-guia e seletor de forma
**Fazer:** os três tempos do §5, linha-guia de 2px vinho com etiqueta, entrada sempre **entre** blocos,
upload + compressão, nó em `wide` e seletor de forma abrindo no bloco novo (Enter/Esc).
**Aceite:** arrastar uma foto do desktop para o meio de um parágrafo cria o bloco na posição da
linha-guia, sem colar link e sem recarregar o rascunho; as quatro formas trocáveis em um clique;
nenhuma largura em pixel exposta.

### 05.6 — Recorte por cima, no editor
**Fazer:** o overlay do §5.2 sobre `rgba(11,11,11,.82)`, chips de proporção nomeada, campo de
descrição, faixa de peso/uso, gravação de `cropId`; ao confirmar, cursor e rascunho intactos.
**Aceite:** recortar uma imagem inserida e voltar com o cursor no mesmo ponto; o original segue
intacto na biblioteca; "usada em N lugares" continua correto depois de publicar.

### 05.7 — Estados e microcópia
**Fazer:** os seis estados do §6 com o texto literal, os quatro badges, barra de autosave no rodapé,
comparação lado a lado no conflito.
**Aceite:** publicar com upload pendente mostra a mensagem exata e o rascunho continua salvo; nenhum
toast efêmero em `/admin`; página vazia abre o menu do `+` no primeiro clique.

### 05.8 — Editar na própria página *(etapa 2 — só depois de 02.2 e 05.5)*
**Fazer:** `?edit=1` na página real com `data-node-id` por nó, área travada, nós editáveis com filete
vinho, lista de blocos de 230px, alternador Editar/Ver, links inertes.
**Aceite:** editar um parágrafo e uma imagem na própria página e publicar, com o mesmo `contentDoc`
do editor em coluna (snapshot idêntico); cabeçalho, rodapé e preço **não** editáveis; nenhuma
migração de dados necessária.

---

## Checklist final — antes de chamar o turno 4 de pronto

- [ ] Sidebar idêntica a `4b`: 264px, logo real, três grupos, item 44px, selecionado em bloco vinho.
- [ ] Nenhum overlay de carregamento em `/admin`; só a barra de 2px `#B3282E`.
- [ ] `grep -r "DCC" src/app/admin` → 0. Todo dado em IBM Plex Mono tabular.
- [ ] Os 11 tipos, nem um a mais; 12º tipo forjado → 422.
- [ ] Os 14 controles da barra na ordem exata de §4, Destaque do selo em bloco vinho.
- [ ] Arraste com linha-guia vinho entre blocos + seletor de forma no bloco novo.
- [ ] Recorte por cima, cursor e rascunho intactos, `cropId` gravado.
- [ ] Os seis estados de §6 com a microcópia ao caractere.
- [ ] Nenhum controle de fonte, cor, tamanho ou espaçamento em lugar algum da interface.
- [ ] Três superfícies por tela, raio zero, nenhum hex cru novo.
- [ ] Screenshots lado a lado de `4b`, `4c`, `4f`, `4g` e do implementado, aprovados antes do merge.
