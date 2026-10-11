---
slice: 13
titulo: "Editoriais no sistema sl-*: /sarau-safado, /projects, /about, /contact"
modelo: "rápido/barato (Haiku ou GPT-mini equivalente) — substituição mecânica de camada visual, sem novo estado"
depende_de: ["02", "10"]
arquivos_previstos:
  - src/app/sarau-safado/page.tsx
  - src/app/projects/page.tsx
  - src/app/about/page.tsx
  - src/app/contact/page.tsx
  - src/ui/contact/contact-form.client.tsx
  - src/ui/sl/sl-editorial-card.tsx (novo)
canvas: "Canvas Selo Libertaria.dc.html — seções 2a (sistema corrigido), 2b (home) e 2c (loja/PDP). 2a é a lei; 2b/2c são a referência de aplicação. Não reimplementar 2b/2c."
custo_estimado: baixo
---

## Objetivo

As quatro páginas editoriais ainda rodam na camada legada `--editorial-*` + `Editorial*` primitives.
Home, loja, PDP, carrinho e checkout já rodam em `src/styles/sl-tokens.css` + `src/ui/sl/*`.
Este slice migra as quatro páginas para o mesmo sistema, sem mudar conteúdo, rotas, schema
editorial ou os formulários do admin. É correção de sistema de design, não redesign.

## Contexto

Leia `prompts/00-CONTEXT.md` (seções 3–6) e `prompts/PROGRESS.md`.
Fonte de verdade dos valores: `src/styles/sl-tokens.css`. Nunca escrever hex novo, nunca criar
token novo, nunca reintroduzir `--editorial-*` nos arquivos deste slice.

## Lei do sistema (2a)

1. `border-radius: 0` em toda a área pública. Nenhum `rounded-*` novo; remover os que existirem.
2. Nenhum `box-shadow` decorativo. O único shadow permitido é `--sl-focus-ring`.
3. Alturas de controle: compra 56 (`--sl-h-buy`, não usar aqui), botão 48 (`--sl-h-button`),
   secundário pequeno 44 (`--sl-h-small`), campo 52 (`--sl-h-field`), chip 26 (`--sl-h-chip`).
   `min-h-11` (44px) deixa de ser o padrão de botão — botão editorial é 48.
4. Escala de tipo travada: hero 96/76/60/40, seção 56/44/36, título de card 22/18, lead 17,
   corpo 16/1.7, meta 14/13, micro-label 11/10 em CAPS com `letter-spacing: .24em` (`.sl-lbl`)
   ou `.sl-eyebrow` (.3em, weight 900). Some `text-5xl`, `text-4xl`, `text-3xl`, `text-xs` nestes arquivos.
5. Duas cores de fundo por página: papel (`--sl-surface-page`) + preto (`--sl-surface-invert`).
   Areia (`--sl-surface-band`) só como **uma** faixa curta (barra de meta / fechamento), nunca
   como terceira seção grande. Hoje /sarau-safado usa papel + preto + areia + `rgba(216,208,196,.55)` — corrigir.
6. Cor de texto: `--sl-text` / `--sl-text-muted` (.72) / `--sl-text-soft` (.65) no papel;
   `--sl-text-on-ink` / `-muted` (.82) / `-soft` (.72) no preto. Corpo de texto nunca abaixo de
   4.5:1 — proibido corpo em `--sl-text-quiet` (.55) ou `--sl-text-on-ink-quiet` (.45).
7. Acento: `--sl-accent` (vinho) para links, eyebrow e ✓. `--sl-buy` (vermelho) **não aparece**
   nestas páginas — não há compra aqui.
8. Imagem: `--sl-image-ratio` (1:1) em card; `--sl-image-ratio-pdp` (4:3) só no aside de hero.
   Remover `aspect-[1.05]`.
9. Container: `mx-auto w-full max-w-[var(--sl-w-desktop)] px-4 sm:px-8 lg:px-12`.
   `EditorialShell` (max-w-7xl / px-8) sai destes arquivos.

## Mapeamento obrigatório (substituições 1:1)

| Legado | Novo |
| --- | --- |
| `EditorialShell` | container acima (helper local `Shell` por arquivo se repetir) |
| `EditorialEyebrow` | `SlEyebrow` de `@/ui/sl/sl-section-head` (`onInk` no preto) |
| `<h2 className="text-4xl …">` de seção | `SlSectionHead title=… action=…` |
| hero manual de cada página | `SlPageHero eyebrow title lead aside` de `@/ui/sl/sl-page-hero` |
| `EditorialPanel` | `.sl-card` + `.sl-body` (ou `SlEditorialCard`, abaixo) |
| `EditorialDarkPanel` / painel preto manual | `div` com `background: var(--sl-surface-invert)`, `color: var(--sl-text-on-ink)`, `border: 1px solid var(--sl-line-on-ink)` |
| `<YnsLink className="inline-flex min-h-11 … tracking-[0.22em]">` | `<SlButton href variant="primary\|secondary" onInk?>` |
| chips/tags `border px-3 py-1 text-[10px]` | `<SlChip tone="line">` (ink/paper quando precisar de peso) |
| `--editorial-paper/ink/accent/beige` | `--sl-paper` / `--sl-ink` / `--sl-accent` / `--sl-sand` |
| `--editorial-border` | `--sl-line-hairline` (moldura) ou `--sl-line-strong` (campo/chip) |
| `--editorial-muted` | `--sl-text-muted` |
| `bg-background text-foreground` no wrapper | `className="sl-scope"` + `style={{ background: "var(--sl-surface-page)", color: "var(--sl-text)" }}` |
| `text-muted-foreground`, `border-border/40`, `text-neutral-500` | tokens `sl-*` equivalentes (proibido cinza de biblioteca) |

`Reveal` / `LiftOnHover` continuam — motion não muda neste slice.

## Novo componente (único permitido)

`src/ui/sl/sl-editorial-card.tsx` — `SlEditorialCard({ image, imageAlt, meta, title, summary, href, ctaLabel })`:
`.sl-card` → `.sl-shot` 1:1 (quando houver imagem, `next/image` com `fill`) → `.sl-body`
(meta em `.sl-lbl` vinho, título `sl-head` 22px com `--sl-track-card`, resumo 13/1.65 em
`--sl-text-muted`, `SlButton variant="secondary"` no rodapé do card, rótulo em pt-BR:
`Ver projeto` / `Ver edição` — nunca `Ver detalhes`, `View`, `Details`).
Usado por /projects (grade de projetos) e /about (cards de linha editorial). Nada além disso é componentizado.

## Por página

### /sarau-safado
- Hero: `SlPageHero` com `eyebrow`, `title` (60px clamp), `lead` 17px, `aside` = os `signals` em `SlChip`.
  Manter `heroBackgroundStyle` de imagem quando existir, sobre o fundo ink; o contraste condicional
  `useDarkHeroText` continua válido, mas o texto claro usa `--sl-text-on-ink*`.
- CTAs do hero: `SlButton variant="primary"` + `SlButton variant="secondary" onInk`.
- Agenda: `SlSectionHead title="Próxima edição e encontros recentes"`; cada linha de evento em
  grade `sm:grid-cols-[5.5rem_1fr]` com período em `.sl-lbl` vinho + título 22px + local/resumo 14/1.7,
  separador `border-b border-[color:var(--sl-line-hairline)]`.
- Bloco “Galeria / memória” permanece o único bloco preto da página.
- Fechamento: uma faixa areia curta com um `SlSectionHead` e os `continueLinks` em `SlButton secondary`.
  Remover o `rgba(216,208,196,0.55)` — usar `var(--sl-surface-band)`.

### /projects
- Hero: `SlPageHero` com `aside` = imagem do projeto destaque em `--sl-image-ratio-pdp`,
  moldura `1px solid var(--sl-line-on-ink)`, sem padding de 20px em cima de moldura (uma moldura só).
- Nota curatorial: duas colunas, corpo 16/1.7 em `--sl-text-muted`, nota secundária 14/1.7 em `--sl-text-soft`.
- Grade de projetos: `SlEditorialCard`, `grid gap-[var(--sl-grid-gap)] lg:grid-cols-3`.
- Estado vazio: `border border-[color:var(--sl-line-strong)] bg-[color:var(--sl-surface-card)] p-6`,
  texto 14/1.7 — sem `border-dashed`.
- Fechamento: uma faixa (areia) com título de seção + `SlButton primary` (Falar sobre projeto) e
  `secondary` (Ver Sarau Safado).

### /about
- Hero em papel é a exceção justificada (é a página de manifesto): `SlPageHero` não serve aqui —
  usar hero papel com `SlEyebrow` + `h1` `sl-head` `clamp(40px,7vw,var(--sl-size-hero-lg))` + lead 17px,
  fechado por `border-b border-[color:var(--sl-line-hairline)]`. Segue valendo: dois fundos (papel + preto).
- Bloco autoria (preto): imagem 1:1 com moldura `--sl-line-on-ink`, título de seção 56 clamp,
  dois parágrafos 16/1.8, `SlButton variant="secondary" onInk`.
- Cards de linha editorial: `SlEditorialCard` sem imagem e sem CTA (ou `.sl-card` direto).
- Manifesto: **remover** `border-l-[12px] border-[color:var(--editorial-accent)]`. No lugar:
  faixa areia com regra superior `2px solid var(--sl-accent)`, eyebrow, citação em `sl-head` 44px,
  corpo 16/1.8 em `--sl-text-muted`. O painel “Princípio central” fica preto, 22px, sem uppercase forçado.

### /contact
- Hero: `SlPageHero` com `aside` = bloco papel do e-mail (título `.sl-lbl` vinho + endereço em
  `.sl-price` 28px, `break-words`).
- Formulário: `EditorialPanel` → `.sl-card` + `.sl-body`; `SlSectionHead` no topo.
- `src/ui/contact/contact-form.client.tsx`: trocar `Input` shadcn por `SlField` (`@/ui/sl/sl-field`,
  52px, rótulo `.sl-lbl` persistente, erro em `--sl-danger` com `--sl-danger-wash`). O `textarea`
  passa a usar `border: 1px solid var(--sl-line-strong)`, `background: var(--sl-surface-card)`,
  `min-h-[176px]`, `px-3.5 py-3`, `text-[16px]`, foco `box-shadow: var(--sl-focus-ring)` + borda ink,
  sem `shadow-xs` e sem `ring-ring`. Botão de envio: `SlButton variant="primary" type="submit"`
  (48px) e o `aria-live` em 12px `--sl-text-soft` (não `text-neutral-500`).
  Manter `datalist`, i18n e a lógica de `status` intactas.
- “Assuntos de contato” (painel preto) e “Canais diretos” (faixa areia): listas separadas por
  hairline, rótulo `.sl-lbl`, item 18px; links em `.sl-link`.
- Fechamento: uma única CTA final; primeiro link `SlButton primary`, resto `secondary`.

## Fora de escopo

Schema editorial, admin, i18n, envio real do formulário de contato, /events, /faq,
`editorial-primitives.tsx` (os `Admin*` continuam usando a camada legada — não tocar).

## Definição de pronto

- [ ] `yarn lint` e `yarn build` passam
- [ ] `grep -rn "editorial-" src/app/{about,contact,projects,sarau-safado}/page.tsx src/ui/contact` → 0 ocorrências
- [ ] `grep -rn "rounded\|shadow-\|min-h-11\|text-4xl\|text-5xl\|text-neutral" ` nos mesmos arquivos → 0
- [ ] cada página com exatamente 2 fundos + no máximo 1 faixa areia
- [ ] 390px e 1440px conferidos; nenhum alvo de toque < 44px
- [ ] contraste de corpo ≥ 4.5:1 (nenhum corpo em `-quiet`)
- [ ] `prompts/PROGRESS.md` atualizado (≤5 linhas)

## Se travar

Pare, registre a dúvida em `prompts/PROGRESS.md` e não invente token, API nem conteúdo.
Não “conserte” slices vizinhos (home, loja, checkout) dentro deste.
