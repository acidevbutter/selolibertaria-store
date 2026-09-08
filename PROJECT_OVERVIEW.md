# Selo Libertária — Visão Geral do Projeto

> Resumo técnico do repositório `selolibertaria-store` (frontend/BFF).
> Gerado como referência rápida. Para detalhe, ver `docs/` e `AGENTS.md`.

---

## 1. O que é

**Selo Libertária** é uma plataforma híbrida de e-commerce editorial, herdada de um
fork de storefront/admin e rebrandada. Não é site institucional nem loja genérica.
Quatro camadas:

1. **Storefront público** — catálogo, PDP, categorias, busca, carrinho, checkout,
   conta, favoritos, pedidos.
2. **Camada editorial** — home, Sobre, Contato, Eventos, Projetos, Sarau Safado, FAQ.
3. **Backoffice admin** — dashboard, hub editorial, produtos, pedidos, usuários,
   promoções, configurações, e-mails, templates de e-mail, webhooks, pré-venda.
4. **Infra / fluxos de suporte** — auth/sessão, pagamentos, frete, e-mails, webhooks.

A "loja" trata **livro como uma das categorias** (ao lado de edições sonoras, zines,
objetos, ingressos, laboratórios) — não é uma livraria.

- **Versão:** 1.12.0 · **Licença:** AGPL-3.0-only (+ licença comercial)
- **Idioma:** pt-BR único (sem multi-locale ativo)
- **Release:** `semantic-release` na branch `main`

---

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 16** (App Router, RSC, Server Actions), **React 19** + React Compiler |
| Linguagem | TypeScript 5.9 (ESM, `"type": "module"`) |
| Estilo | **Tailwind CSS v4** (`@tailwindcss/postcss`), tokens CSS `--sl-*`, `tailwindcss-animate` |
| UI | Radix UI primitives, `lucide-react`, `framer-motion`, `sonner`, `vaul`, `cmdk` |
| Conteúdo | MDX (`@next/mdx`, `next-mdx-remote`) |
| Validação | `zod` v4 · env: `@t3-oss/env-nextjs` |
| Auth/cripto | `jose` (JWT/sessão), `bcryptjs` |
| Charts (admin) | ApexCharts / `react-apexcharts` |
| Lint/format | **Biome** (`yarn lint` = `biome check --write`) |
| Testes | **Vitest 4** + Testing Library + jsdom |
| Package manager | **Yarn Classic (1.x)** — não introduzir segundo lockfile |
| Node | `^24 || ^25` |
| Observabilidade | Datadog RUM, Vercel Analytics + Speed Insights, Umami (rewrite `/stats/*`) |
| Deploy | Vercel (`scripts/vercel-build.mjs`) · Docker/Compose para dev |

---

## 3. Arquitetura: Next.js como BFF + backend FastAPI

O Next.js está sendo transformado em **BFF / borda web**. A lógica de domínio,
persistência e segredos de provider migraram (em grande parte) para um backend
**FastAPI + PostgreSQL**, que vive como **git submodule** em `backend/`
(`git@github.com:acidevbutter/selolibertaria_backend.git`).

- Migração **MongoDB → FastAPI/PostgreSQL** documentada em
  `docs/architecture/fastapi-migration-map.md` e `docs/prompts/fastapi-bff-migration/`.
  O client Mongo, pacote e envs já foram **removidos** do Next; rotas restantes são
  proxies autenticados para o FastAPI.
- Contrato interno: `FASTAPI_API_URL` + `FASTAPI_INTERNAL_API_KEY`
  (em Compose: `selolibertaria-backend:8000`; host: `http://localhost:9001`).
- Domínios já atrás do FastAPI: editorial, promoções/cupons, dashboard admin,
  settings, webhooks/logs, OAuth identity, frete (Melhor Envio), CEP, carrinho de
  convidado, uploads de mídia, newsletter, comunicações/alertas.
- Diagramas: `docs/diagrams/next-fastapi-api-flows.mmd`, `fastapi-api-current.mmd`.
- Pendências conhecidas: OAuth Instagram, PostgreSQL integrado end-to-end,
  execução de migrations Alembic, smoke E2E, homologação sandbox de pagamento.

---

## 4. Pagamentos

Provider ativo é **gated por env** `NEXT_PUBLIC_PAYMENTS_PROVIDER`:
`mercado_pago` (default) | `asaas` | `disabled`.

- **Branch atual `homol/storefront-asaas`:** checkout público cria cobrança **PIX
  na Asaas pelo backend** e redireciona para o **checkout hospedado** da Asaas;
  confirmação via backend/webhook. Homologação Sandbox ainda depende de credencial,
  certificado mTLS, migration e webhook. Env: `NEXT_PUBLIC_ASAAS_ENV`.
- **Mercado Pago:** código do checkout transparente (Pix + cartão em até 6x,
  tokenização só pelo SDK/Brick, sem carteira local) permanece no repo, mas só é
  ligado quando o provider é `mercado_pago`. Migração para Orders API documentada
  em `docs/mercado-pago-orders-api-migration/`.
- **Boleto:** toggle no admin (`/admin/settings`), desligado por padrão.
- `src/lib/payments.ts` — flags `isMercadoPagoActive` / `isAsaasActive` / `ASAAS_ENV`.
- Runbook: `docs/checkout-orders-runbook.md`.

---

## 5. Design System "SL" (Selo Libertária)

Origem: projeto **Claude Design** "Canvas Selo Libertaria" (`.dc.html`), referência
visual canônica. Estética editorial/punk: fundo escuro, vinho `#7A1E22`, off-white
`#F7F4EF`, display em `DCCAsh` / corpo `Fertigo`.

- Tokens: `src/styles/sl-tokens.css` (camada `--sl-*`), `src/app/globals.css`.
- Componentes: `src/ui/sl/` — `sl-button`, `sl-field`, `sl-product-card`,
  `sl-page-hero`, `sl-section-head`, `sl-band`, `sl-breadcrumb`, `sl-chip`, etc.
- **Checkout / pagamento (já implementado e em uso):**
  `sl-checkout-stepper`, `sl-order-summary`, `sl-mini-product-row`,
  `sl-shipping-option`, `sl-free-shipping-meter`, `sl-coupon-field`,
  `sl-quantity-stepper`, `sl-pix-panel`, `sl-boleto-panel`, `sl-installment-list`,
  `sl-payment-method-tabs`, `sl-payment-state`, `sl-card-brand-row`, `sl-saved-card`.
  Consumidos por `src/app/checkout/*`, `src/components/cart-sidebar.tsx`,
  `src/app/(store)/product/[slug]/page.tsx`.
- **Migrado para SL:** home, loja, PDP, cart drawer, checkout (re-skin do form MP),
  header/footer, `/category`, `/search`, tela de processing, páginas estáticas
  (Sobre, Contato, Projetos, Sarau Safado).
- Prompts de slice: `docs/prompts/canvas-selo-libertaria/`.

---

## 6. Estrutura de pastas

```
src/
  app/
    (store)/            grupo do storefront: products, product/[slug], category,
                        search, orders, pre-venda/little-fish-big-fish
    about|contact|projects|projects/[slug]|sarau-safado|events|faq|terms|privacy
    checkout/           page, prepare/, processing/, return/  (fluxo de pagamento)
    account|user|login|reset-password|forbidden|maintenance
    admin/              dashboard, editorial, products, orders, users, promotions,
                        settings, emails, email-templates, webhooks, pre-venda
    api/                address, admin, auth, cart, cron, user(s)
  actions/              server actions (checkout-actions, etc.)
  components/           cart-sidebar e componentes compartilhados
  context/              React contexts (cart, etc.)
  i18n/                 config (pt-BR único) + server helpers
  lib/                  domínio/BFF: catalog, cart-pricing, checkout-*, payments,
                        payment-status, shipping*, promotions*, settings*, authz,
                        auth*, session, commerce-fastapi, editorial-*, pre-sale*
  styles/              sl-tokens.css
  test/                 stubs de teste (server-only-stub.ts)
  ui/                   sl/ (design system) + auth, home, products, nav, footer,
                        editorial, contact, faq, favorites, charts, motion, shadcn

backend/                submodule FastAPI + PostgreSQL (fonte de domínio)
docs/                   spec de produto, mapas de migração, runbooks, prompts
prompts/                prompts de trabalho por fase
messages/pt-BR.json     strings i18n
scripts/vercel-build.mjs  entrypoint de build
```

---

## 7. Autorização & Auth

- Auth própria: login por credencial + OAuth (Google ok; Instagram pendente),
  criação/linking de identidade via endpoint interno do FastAPI.
- Sessão em cookie assinado (`jose`); único segredo no Next é `OAUTH_STATE_SECRET`.
- RBAC por **capabilities** em `src/lib/authz.ts` (`type Capability`,
  `ROLE_CAPABILITIES`). Ex.: `presale.read` / `presale.write`, `settings.write`,
  `orders.read`, etc. Itens de nav do admin em `src/app/admin/_components/nav-config.ts`.
- **Maintenance mode:** `MAINTENANCE_MODE=true` redireciona todas as rotas públicas
  para `/login`; só admin entra (`src/lib/maintenance-mode.ts`).

---

## 8. Pré-venda (Little Fish Big Fish)

- Landing pública `/(store)/pre-venda/little-fish-big-fish` + modal de contagem
  regressiva global.
- **Modo controlado no admin** em `/admin/pre-venda` (capability `presale.read/write`),
  persistido em settings — `PRESALE_MODE` (env) **não participa mais** da decisão.
- `current.preSale`: `pageEnabled`, `popupEnabled`, `launchAt`, `windowStartAt`,
  `windowEndAt`. Página e modal são controles independentes, ativos só dentro da
  janela. Lógica em `src/lib/pre-sale.ts` / `pre-sale.server.ts` (+ testes).
- Prompts: `docs/prompts/pre-venda-0{1,2,3}-*.md`.

---

## 9. Comandos

```bash
yarn install
yarn dev          # next dev --webpack -p 3001  → http://localhost:3001
yarn build        # node scripts/vercel-build.mjs
yarn start
yarn lint         # biome check --write
yarn test         # vitest run
yarn test:watch
```

Docker dev:

```bash
docker network create devbutter_shared 2>/dev/null || true
docker compose up -d --build frontend    # http://localhost:3001
```

Notas: manter Yarn Classic e convenções do App Router; MP e integrações
server-safe; se build/dev travar, limpar `.next/` antes de suspeitar da lógica.

---

## 10. Variáveis de ambiente (principais)

Ver `.env.example`. Destaques:

| Var | Uso |
|---|---|
| `NEXT_PUBLIC_URL` | URL pública base |
| `NEXT_PUBLIC_PAYMENTS_PROVIDER` | `mercado_pago` \| `asaas` \| `disabled` |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | SDK/Brick MP |
| `NEXT_PUBLIC_ASAAS_ENV` | `sandbox` \| `production` |
| `FASTAPI_API_URL` / `FASTAPI_INTERNAL_API_KEY` | contrato interno com o backend |
| `OAUTH_STATE_SECRET` | cookie de state do OAuth (≥32 chars) |
| `BUTTER_BLOB_PUBLIC_HOST` | hosts liberados para `next/image` |
| `MAINTENANCE_MODE` | trava o site em `/login` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / … | seed do admin |
| `NEXT_PUBLIC_DD_*` | Datadog RUM |

---

## 11. Documentação de referência

- `AGENTS.md` — regras para agentes (menu público, rotas, direção visual).
- `CLAUDE.md` — uso do RTK (wrapper de comandos que economiza tokens).
- `docs/product/spec.md` · `docs/product/site-overview.md` · `docs/product/TODO.md`
- `docs/product/SELOLIBERTARIA_SITE_MAP.md` — mapa de navegação/conteúdo.
- `docs/design/UI_UX_PATTERNS.md` · `userinterface.md` · `userexperience.md`
- `docs/architecture/fastapi-migration-map.md` · `admin-fastapi-postgres-only-plan.md`
- `docs/checkout-orders-runbook.md` · `docs/mercado-pago-sandbox-test.md`
- `docs/mercado-pago-orders-api-migration/` — migração para Orders API.
- `docs/prompts/` — slices coordenados (canvas SL, migração FastAPI/BFF, pré-venda).
- `CHANGELOG.md` — histórico detalhado (gerado por semantic-release).
