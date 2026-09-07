# Prompts — Pré-venda (Little Fish Big Fish)

Esta pasta reúne os **prompts de implementação** das funcionalidades da tela de
pré-venda e do pop-up importados de Claude Design
(`Pre-venda Little Fish Big Fish.dc.html`).

Os prompts coordenados da migração Next.js BFF → FastAPI estão em
[`fastapi-bff-migration/`](./fastapi-bff-migration/), com ordem e contratos
compartilhados entre backend e frontend.

O que **já existe** no repositório (camada visual / presentational):

| Arquivo | Papel |
| --- | --- |
| `src/lib/pre-sale.ts` | Tipos `PreSaleCampaign`, campanha estática `LFBF_CAMPAIGN`, flag `isPreSaleModeEnabled()` (lê a configuração persistida do admin), helpers `getPreSaleCampaign` / `resolveCountdownTarget` / `fillCampaignText`. |
| `src/ui/pre-venda/pre-sale-landing.tsx` | Composição completa da tela + blocos reutilizáveis `PreSaleHeroBanner` (A) e `PreSaleHighlightCard` (B). |
| `src/ui/pre-venda/pre-sale-countdown-popup.client.tsx` | Pop-up de contagem regressiva: auto-open, snooze via `localStorage`, Esc / backdrop / ✕. |
| `src/app/(store)/pre-venda/little-fish-big-fish/page.tsx` | Rota. `notFound()` quando o modo pré-venda está desligado. |

O que **falta** (cada item tem um prompt dedicado):

| Prompt | Escopo |
| --- | --- |
| [`pre-venda-01-landing.md`](./pre-venda-01-landing.md) | Dados dinâmicos da campanha, checkout real (Mercado Pago), i18n, SEO/OG, analytics, estados de borda. |
| [`pre-venda-02-countdown-popup.md`](./pre-venda-02-countdown-popup.md) | Fonte da verdade do countdown, regras de exibição/capping, acessibilidade, telemetria de conversão. |
| [`pre-venda-03-admin-modo-pre-venda.md`](./pre-venda-03-admin-modo-pre-venda.md) | **Painel admin para ativar/desativar o modo pré-venda**, agendar a janela, editar a campanha, gating de rota, auditoria. |

## Como usar

Cada `.md` é um prompt autossuficiente: contexto, objetivo, requisitos
funcionais, contrato de dados, critérios de aceite e pontos de teste. Rode um por
vez, na ordem 03 → 01 → 02 (o toggle de admin destrava os outros dois), abrindo PR
isolado por prompt.

## Convenções do repo a respeitar

- Next.js 16 App Router, React 19, Server Components por padrão; sufixo
  `.client.tsx` para Client Components.
- Tailwind v4 (sem `tailwind.config`); tokens editoriais em `src/app/globals.css`.
  A paleta da campanha LFBF (`#0B0B0B`, `#F2891E`, `#E2461A`, `#F7F4EF`) é
  intencionalmente local — não forçar `--editorial-accent`.
- i18n via `next-intl` custom (`src/i18n/*`, mensagens em `messages/pt-BR.json`,
  namespace `Selo.*`).
- Biome: indentação com TAB, `lineWidth` 110. Rodar `yarn lint` antes do commit.
- Testes com Vitest (`*.test.ts[x]` ao lado do código).
- Flags "de infra" que precisam ser lidas no edge proxy leem `process.env`
  direto (padrão de `src/lib/maintenance-mode.ts`).
