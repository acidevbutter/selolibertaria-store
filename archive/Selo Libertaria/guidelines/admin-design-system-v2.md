# Oficina — design system do admin (v2)

Sistema **próprio do painel**, decidido em 13 set 2026 para executar o **turno 4** (editor de páginas).
Substitui `admin-design-system.md` dentro de `/admin`. A loja não muda: v1 continua valendo em tudo que é público.

**Tese:** o admin não é uma página do site, é uma oficina. Duas metades declaradas —
**casca de tinta** (onde você navega) e **mesa de papel** (onde você trabalha). A tela diz, sem legenda,
o que é ferramenta e o que é conteúdo. Onde o v1 usava uma superfície só e resolvia tudo em filete,
aqui a hierarquia é de material.

Herdado do v1, sem discussão: **raio zero**, sem sombra decorativa, transição 120ms linear,
foco = filete tinta + halo vinho, escrita direta em português.

---

## 1. Cores

### Casca (chrome — sidebar, topbar, overlay)

| Token | Hex | Uso |
|---|---|---|
| `--ad-shell` | `#0B0B0B` | rail e topbar — tinta, igual à nav pública |
| `--ad-shell-2` | `#1F1A16` | superfície elevada da casca: busca, menu de conta, moldura de recorte |
| `--ad-on-shell` | `#F7F4EF` | texto, logo e contraste sobre a casca |
| item selecionado | `#7A1E22` | bloco sólido vinho com texto papel |
| hover / rota-pai | `rgba(247,244,239,.06)` | nunca elevação, nunca bege suave |
| filete da casca | `rgba(247,244,239,.14)` | divisor dentro do escuro |
| rótulo de grupo / eyebrow | `rgba(247,244,239,.55)` | mono 10px sobre a casca — mínimo para 4.5:1 |
| `--ad-signal` | `#B3282E` | marcador e barra de progresso **sobre escuro** (nunca texto) |

### Mesa (workbench — a área de trabalho)

| Token | Hex | Uso |
|---|---|---|
| `--ad-desk` | `#EFEAE2` | fundo da área de trabalho — **novo**, entre papel e bege |
| `--ad-sheet` | `#FFFFFF` | folha: cartão, editor, tabela, campo |
| `--ad-paper` | `#F7F4EF` | prévia de conteúdo público dentro do editor |
| `--ad-sand` | `#D8D0C4` | barra de ferramentas, rodapé de ação, cabeçalho de tabela |
| `--ad-ink` | `#0B0B0B` | texto e botão principal |
| `--ad-wine` | `#7A1E22` | ação destacada, link, seleção, linha-guia de arraste, erro |

A mesa é o único lugar com branco. A casca não tem branco puro. Três superfícies por tela, no máximo:
casca → mesa → folha. **Vermelho `#B3282E` só existe sobre escuro**; sobre papel a voz é o vinho.

Filetes na mesa: `rgba(11,11,11,.12)` folha · `.20` divisor · `.30` campo e botão secundário.

## 2. Tipografia

Duas famílias. **DCC Ash não existe mais no admin** — display de fantasia atrapalha leitura de dado.

- **Fertigo** — títulos e corpo. Título em CAIXA-ALTA, 900, `letter-spacing:-.04em`, `line-height:.92`.
- **IBM Plex Mono** — **todo dado**: id, data, hora, valor, contagem, dimensão, nome de arquivo,
  tamanho, atalho de teclado, nome de tipo no schema, rótulo de sistema. Peso 400/500; 600 só em total.

Escala nova do painel (menor que a da loja — a tela é de trabalho, não de vitrine):

| Papel | Tamanho |
|---|---|
| Título de tela | 36 / 28 mobile |
| Título de seção | 24 |
| Título de cartão | 18 |
| Corpo | 15 / 1.7 |
| Apoio | 13 |
| Micro-label | 11 / 900 / `.22em` / uppercase |
| Rótulo de grupo (sidebar) | mono 10 / `.22em` / uppercase / papel `.55` |
| Dado em tabela | mono 13 |
| Dado em linha secundária | mono 12 |

Números tabulares com `font-variant-numeric: tabular-nums`. Valor monetário alinhado à direita.

## 3. Alturas de controle

Escala nova, densidade **média**: a lista cabe mais sem virar planilha.

| Elemento | Altura |
|---|---|
| Topbar | 56 |
| Linha de lista / tabela | **48** |
| Campo, botão principal, botão secundário | 44 |
| Item da sidebar | 44 |
| Botão de barra de ferramentas | 36 |
| Chip, barrinha do bloco | 28 |
| Badge | 24 |
| Indicador de carregando (topo do conteúdo) | 2 |

Rail da sidebar: 240px. Coluna do editor: 780px de medida de texto, centralizada na mesa.
Padding de folha: 20–28. Gap de grade: 16.

## 4. Componentes novos ou redefinidos

**Sidebar — componente fechado, o mesmo em todo canvas novo do admin.** Herda o padrão decidido
no bug #9 e só acrescenta os três grupos:

- Rail `264px`, fundo `#0B0B0B`, padding vertical 24, raio zero.
- Topo: quadrado papel de 44px com `assets/img/selolibertaria.png` (padding 6) + lockup
  **Libertária** 13/900/`.24em` uppercase e **Painel editorial** 10/900/`.24em` em `rgba(247,244,239,.55)`.
- Grupos **Conteúdo · Operação · Sistema**, rótulo mono 10/`.22em` uppercase em `rgba(247,244,239,.42)`,
  padding lateral 28. Nada de papel abaixo de `.55` de opacidade: 10–11px exige 4.5:1 cheio.
- Item 44px, padding lateral 28, 15px, `rgba(247,244,239,.72)`.
  **Selecionado = bloco sólido vinho `#7A1E22`**, texto papel, 900, `.04em`, uppercase.
  Rota-pai/hover = `rgba(247,244,239,.06)`. Sem marcador redondo, sem ícone, sem bege suave.
- Contagem à direita em mono 11. Subrota marca o **item da subrota**, não o grupo.
- Rodapé: nome e papel do usuário + capability em mono 11.

Copiar este bloco como está; não redesenhar por canvas.

**Breadcrumb** — mesa, 13px, cada nível é link em vinho, separador `›` em `rgba(11,11,11,.4)`,
último nível em tinta 900. Fica acima do título, nunca dentro do cartão.

**Carregando** — barra de 2px em `#B3282E` no topo da área de conteúdo + item clicado em
`rgba(247,244,239,.08)`. **Nunca overlay preto**: a tela anterior continua visível e legível.

**Barra de ferramentas do editor** — faixa bege, botões de 36px, divisores de 1px, grupos separados
por 10px. Ativo = bloco tinta com texto papel. Destaque do selo = bloco vinho.

**Barrinha do bloco** (hover) — 28px, tinta sólida, texto papel, mono 11: `Recortar · Trocar ·
Legenda · Mover ⇅ · Remover`. Aparece colada no canto superior direito do bloco, dentro da folha.

**Linha-guia de arraste** — 2px vinho, largura da coluna de texto, com etiqueta mono 10px
("solta aqui"). É o único elemento animado do editor (aparece/some em 120ms).

**Overlay de recorte** — painel centrado sobre a casca escurecida (`rgba(11,11,11,.82)`),
folha branca, 44px nos botões. Fecha devolvendo o cursor ao ponto exato do rascunho.

**Rodapé de ação flutuante** — faixa bege grudada no rodapé da mesa: estado à esquerda em mono
("Rascunho salvo às 14:32"), `Ver como fica` (secundário) e `Publicar` (vinho) à direita.

**Badge de estado** — 24px, mono 11: Publicado = bege/texto vinho · Rascunho = filete tinta 30% ·
Em curso = tinta sólida/papel · Falha = lavagem vinho 12% com filete vinho 40%.

## 5. Regras duras

1. Vermelho só sobre escuro; vinho só sobre papel.
2. Todo número em mono. Nenhum número em Fertigo, nenhum em DCC Ash.
3. Três superfícies por tela: casca, mesa, folha. Nada de quarta cor de fundo.
4. Zero raio, zero sombra, zero gradiente, zero ícone desenhado à mão. Glifos Unicode e arquivos reais.
5. Nenhum controle de estilo exposto ao editor de conteúdo: sem fonte, sem cor, sem tamanho, sem espaçamento.
6. Estado vazio explica e oferece a saída; erro diz o que fazer e o que não se perdeu.

## 6. Modo "editar na própria página"

Segunda casca de edição, opcional, sobre a página real em `?edit=1` (mesma origem, dentro da mesa).
Só é possível porque o renderer é único e puro. Regras:

- **Área travada** — cabeçalho, rodapé, preço e estoque ganham faixa `#0B0B0B` com rótulo mono 11
  "área travada". Não recebem hover nem barrinha.
- **Nó editável** — filete vinho 1px no hover, barrinha de bloco no canto superior direito, e o tipo
  do nó em mono 11 na própria barrinha (`paragraph`, `image`).
- **Bloco vazio ou de dados** (vitrine, agenda) — filete tracejado `rgba(11,11,11,.3)` e modo amostra.
- **Lista de blocos** — folha de 230px à direita, linha de 40px, selecionado em bloco vinho,
  índice em mono 11. Arrastar ali reordena sem rolar a página.
- **Alternador Editar / Ver** — par de chips de 28px na topbar da casca; ativo = bloco papel/texto tinta.
- Links e botões da página ficam inertes no modo edição. Nada de segundo formato de documento.

## 7. Onde está aplicado

- `Canvas Admin Turno 4 - Editor.dc.html` — origem do v2, turno 4 completo.
- Próximos: fatias 01, 03 e 04 migram ao serem executadas. `Fase *.dc.html` seguem em v1 até lá.
