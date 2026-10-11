# Handoff Spec: Canvas Admin Selo Libertária — `/login`, `/admin` (dashboard), `/user`

## Overview

Pacote de handoff para corrigir as divergências identificadas na auditoria do painel administrativo da Selo Libertária. Escopo: dashboard `/admin` (desktop 1440 + mobile 390) e `/login` (mobile 390). `/user` fica registrado como decisão de produto, não como spec de tela nova.

## Layout

Larguras: `--sl-w-desktop: 1440px`, `--sl-w-mobile: 390px`. Sidebar admin em 264px fixo (sem token hoje — considerar `--sl-w-sidebar-admin` novo). Gutter desktop `--sl-gutter-desktop: 48px` já correto no conteúdo principal.

## Design Tokens Usados

| Token | Valor | Uso nesta correção |
|---|---|---|
| `--sl-font-display` | "DCCAsh", "Iowan Old Style", Georgia, serif | Aplicar em todo valor numérico do dashboard (P0) |
| `--sl-size-hero-md` | 60px | Título "Operação da loja" desktop (hoje 64px) |
| `--sl-size-section-mobile` | 36px | Título mobile (hoje 34px) |
| `--sl-h-field` | 52px | Altura do campo de login (hoje 40px) |
| `--sl-h-button` | 48px | Altura do botão "Entrar"/"Google" (hoje 40/44px) |
| `--sl-h-small` | 44px | Alvo mínimo de toque — piso para todo controle |
| `--sl-radius` | 0 | Zerar tabela, cards brancos, sidebar (ou registrar exceção) |
| `--sl-wine` / `--sl-accent` | #7A1E22 | Badge "Pago", estado selecionado da sidebar |
| `--sl-danger` | var(--sl-wine) | Badge "Falhou" — nunca vermelho de sistema |
| `--sl-danger-wash` | rgba(122,30,34,.06) | Fundo do badge "Falhou" |
| `--sl-line-hairline` / `--sl-line` | rgba(11,11,11,.14) / .20 | Filete da tabela (hoje `#e4e4e7`) |
| `--sl-line-solid` | var(--sl-ink) | Estado selecionado sólido da sidebar |
| `--sl-text-label` | rgba(11,11,11,.60) | Placeholder/label do login (hoje .4) |
| `--sl-focus-ring` | 0 0 0 2px rgba(122,30,34,.20) | Foco visível em campo/botão |
| `--sl-transition` | 120ms linear | Toda transição de hover/estado |

## Componentes

| Componente | Variante | Notas |
|---|---|---|
| `Field` | state="default"/"focus"/"error" | Já existe com estado de erro correto — login deve consumir este componente em vez do `<span>` estático |
| `Button` | variant="primary", size="md" (48px) | Botão "Entrar" |
| `Button` | variant="secondary", size="md" | Botão "Continuar com Google" — remover instagram.svg, usar wordmark reta |
| `Chip` | nova variante tone="danger" | Badge "Falhou": bg `--sl-danger-wash`, cor `--sl-danger` |
| `Chip` | tone="sand" | Badge "Pago": bg `--sl-sand`, cor `--sl-wine` |
| Sidebar nav item | novo estado `selected` | bg `--sl-line-solid` (preto sólido) + texto papel |
| Stat card | — | `font-family: var(--sl-font-display)` no valor |

## States and Interactions

- Campo login: padrão (borda `--sl-line-strong`) → foco (`--sl-line-solid` + `--sl-focus-ring`) → erro (`--sl-danger` + `--sl-danger-wash` + hint com frase de saída, ex. "Senha incorreta. Tente novamente ou recupere sua senha.")
- Botão "Entrar": hover escurece 10–15% (`--sl-transition`); loading desabilita mantendo 48px, texto "Entrando…" (sem spinner gráfico)
- Card "Falhas": clicável → navega para tabela filtrada por status=Falhou
- Sidebar item selecionado: bloco sólido preto, sem hover extra

## Responsive Behavior

- Desktop (1440px): sidebar fixa 264px, título 60px, stat cards 4 colunas
- Mobile (390px): header fixo 56px com hambúrguer, título 36px, stat cards 2 colunas, todos os controles ≥44px

## Edge Cases

- Campo vazio ao submeter: `Field` state="error", hint "Preencha email e senha."
- Login social sem conta prévia: pergunta em aberto para o PM
- Tabela de pedidos vazia: usar "quadro bege vazio" em vez de placeholder cinza genérico
- Radius da sidebar como exceção: se mantido, documentar como token novo explícito (ex. `--sl-radius-admin-nav`)
- `/user` + `/orders` separados: decisão de arquitetura de informação, fora do escopo de spec visual

## Animation / Motion

Toda transição: 120ms linear (`--sl-transition`). Proibido: bounce, easing dramático, entrada animada, parallax, elevação/escala no hover.

## Accessibility Notes

- Ordem de foco no login: logo (não focável) → Email → Senha → Entrar → Google → Criar conta
- `Field` precisa de `<label htmlFor>` real associado ao `<input>` na implementação (o componente do design system é presentacional puro)
- Nenhum texto abaixo de `--sl-text-quiet` (.55) fora do estado desabilitado
- Nenhum controle interativo abaixo de `--sl-h-small` (44px) em mobile
- Hint de erro do `Field` associado via `aria-describedby`; `aria-invalid="true"` quando state="error"
- Ícone/wordmark do Google: `aria-hidden="true"` (decorativo, texto já anuncia o provedor)