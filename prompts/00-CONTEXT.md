# 00-CONTEXT — Selo Libertária (loja)

> ⚠️ LIMITAÇÃO DESTA GERAÇÃO: esta sessão não teve acesso autenticado ao Claude
> Design (`Canvas Selo Libertaria.dc.html`, projeto `018e9063-10de-4a25-81c9-d51db44f8613`).
> O client de sync de design exige `/design-login` interativo, indisponível em
> execução headless. Os tokens abaixo vêm do meta-prompt original + docs locais
> (`docs/design/userinterface.md`, `docs/design/UI_UX_PATTERNS.md`), que já
> citam o Canvas como referência. Antes do slice 01, alguém com acesso ao
> Canvas deve: (a) confirmar os valores marcados `[CONFIRMAR]`, (b) rodar
> `grep -n "data-screen-label"` no `.dc.html` exportado e colar as faixas de
> linha reais nos frontmatters `canvas:` de cada slice abaixo.

## 1. Stack real

- Next.js 16.2.4, App Router, React 19.2.5 / react-dom 19.2.5.
- Tailwind CSS 4.1.13 via `@import "tailwindcss"` em `src/app/globals.css` (sem `tailwind.config.js` clássico — tokens em bloco `@theme`).
- shadcn/ui, style `new-york`, aliases: `components→@/ui`, `ui→@/ui/shadcn`, `hooks→@/ui/shadcn/hooks`, `lib→@/lib`, `utils→@/lib/utils` (`components.json`).
- Radix UI (`@radix-ui/react-*`) sob os primitivos shadcn.
- framer-motion 12.23.24 para motion/animações (`src/ui/motion`).
- Pagamento: Mercado Pago — checkout transparente, Payment Brick para cartão, Pix nativo (QR + copia-e-cola). Único provider ativo, sem fallback.
- Frete: Melhor Envio (server-side), calculado hoje dentro do `/checkout`.
- Banco: MongoDB (loja) + backend FastAPI em migração (`backend/`, branch atual `feature/fastapi-backend-scaffold`).
- Gerenciador: yarn 1.22.22. Node via `.nvmrc`.
- Lint/format: `yarn lint` → `biome check --write` (tabs, indentWidth 2, lineWidth 110).
- Testes: `yarn test` → `vitest run`; `yarn test:watch` → `vitest`.
<<<<<<< HEAD
- Build: `yarn build` → `next build --webpack`. Dev: `yarn dev` → `next dev --webpack -p 3001`.
=======
- Build: `yarn build` → `node scripts/build.mjs`. Dev: `yarn dev` → `next dev --webpack -p 3001`.
>>>>>>> origin/staging
- i18n: `messages/pt-BR.json` (688 linhas). Produto travado em `pt-BR` — sem seletor de idioma (ver `docs/design/userinterface.md`, atualização 2026-06-25).

## 2. Convenções

- Route groups: `src/app/(store)/…` = storefront público (`page.tsx`, `products`, `product/[slug]`, `category/[slug]`, `search`, `orders`, `pre-venda`).
- Outras rotas públicas fora do grupo: `checkout`, `login`, `user`, `account`, `about`, `contact`, `faq`, `events`, `projects`, `sarau-safado`, `terms`, `privacy`.
- `admin/*` isolado, shell próprio (sidebar preta, conteúdo papel — ver seção 3 admin em `docs/design/userinterface.md`).
- Client components: sufixo `.client.tsx`. Server components são o padrão.
- Componentes de domínio: `src/ui/<domínio>/*` (ex.: `src/ui/nav`, `src/ui/footer`, `src/ui/products`, `src/ui/auth`, `src/ui/editorial`, `src/ui/favorites`, `src/ui/faq`, `src/ui/contact`, `src/ui/motion`, `src/ui/charts`).
- Primitivos shadcn: `src/ui/shadcn/*` (button, card, badge, dialog, drawer, dropdown-menu, input, label, navigation-menu, popover, radio-group, select, sheet, skeleton, sonner, table, tabs, tooltip, checkbox, collapsible, command, alert, breadcrumb, password-input).
- Componentes não-shadcn compartilhados: `src/components/*` (ex.: `cart-sidebar.tsx`, `cart-sidebar-host.tsx`, `cart-icon.test.tsx`).
- Server actions: `src/actions/*`.
- Lib de domínio: `src/lib/*` (`mercado-pago-orders`, `oauth`, `email-templates`, `auth`, `location`, `checkout`, `search`, `editorial-content-seed.ts`).
- Estilo global: `src/app/globals.css` (Tailwind + classes utilitárias `.display-font`, `.title-font`, `.price-font`, `.editorial-serif`, blocos `.admin-editorial-*`) + `src/styles/glitch.css`.
- Fontes hoje em `public/fonts/`: **apenas `FertigoPro-Regular.otf` presente. `DCC-Ash.otf` (numerais/preço) NÃO está no repo** — precisa ser adicionado no slice 01 (pedir ao design/cliente).
- Testes co-localizados (`*.test.tsx` ao lado do componente), ex.: `mercado-pago-checkout-form.client.test.tsx`.

## 3. Tokens travados (literais — copiar, não parafrasear)

**Cores**
| Token | Valor | Uso |
|---|---|---|
| preto | `#0B0B0B` | texto principal / seções escuras |
| fundo canvas | `#141210` `[CONFIRMAR]` | não aparece nos docs locais — verificar se é um preto secundário ou erro de transcrição do canvas |
| papel | `#F7F4EF` | fundo padrão |
| bege | `#D8D0C4` | bege envelhecido, seções alternadas |
| vinho | `#7A1E22` | vinho seco (acento) |
| vinho claro/ação | `#B3282E` `[CONFIRMAR]` | CTA — não aparece nos docs locais, confirmar contra canvas antes do slice 01 |

**Tipografia**
- `DCCAsh` → numerais/preço (`.price-font`). Fonte ainda não está no repo.
- `Fertigo` (`FertigoPro-Regular.otf`, já em `public/fonts`) → títulos e corpo (`.title-font`, `.editorial-serif`).
- Escala: hero `96/60/40` · seção `56` · card `22` · corpo `16/1.7` · micro-label `10–11` uppercase `letter-spacing:.24em`.

**Geometria**
- `border-radius: 0` em toda a área pública (admin pode manter cantos retos também, mas não é o foco do slice 01).
- Campo editorial: `52px` de altura.
- Botões: `56 / 48 / 44px` (3 tamanhos).
- Alvo mínimo mobile: `44px`.
- Imagem de produto: proporção `1:1`.

**Fundo**
- Máx. 2 cores por página, alternando papel → preto → bege.
- Contraste mínimo `4.5:1`.

## 4. Mapa de telas → arquivos

| Tela | id canvas | linhas | rota | arquivos que mudam |
|---|---|---|---|---|
| Fundação/tokens | 2a | `[CONFIRMAR]` | — | `src/app/globals.css`, `src/ui/shadcn/button.tsx`, novo `src/ui/shadcn/field.tsx`, `src/ui/shadcn/badge.tsx`, novo `src/ui/price-block.tsx` |
| Shell (Nav/Footer) | 2b/2e | `[CONFIRMAR]` | global layout | `src/ui/nav/*`, `src/ui/footer/*`, `src/app/(store)/layout.tsx` |
| Home | 2b | `[CONFIRMAR]` | `/` | `src/app/(store)/page.tsx`, novos componentes de seção em `src/ui/home/*` |
| Loja/catálogo | 2c | `[CONFIRMAR]` | `/products` (renomear rota é decisão separada, ver 00-INDEX) | `src/app/(store)/products/page.tsx`, `src/ui/products/*` |
| PDP | 2c | `[CONFIRMAR]` | `/product/[slug]` | `src/app/(store)/product/[slug]/page.tsx`, `product-image-gallery.client.tsx`, `product-image-modal.tsx` |
| Carrinho | 2d | `[CONFIRMAR]` | drawer global | `src/components/cart-sidebar.tsx`, `cart-sidebar-host.tsx` |
| Checkout | 2d | `[CONFIRMAR]` | `/checkout` | `src/app/checkout/page.tsx`, `checkout-form.client.tsx` |
| Pagamento | 2f | `[CONFIRMAR]` | `/checkout` (bloco) | `src/app/checkout/mercado-pago-checkout-form.client.tsx` |
| Editoriais | 1a-… `[CONFIRMAR — seção antiga, adaptar]` | — | `/projects`, `/sarau-safado`, `/events`, `/about`, `/contact`, `/faq` | `src/app/{projects,sarau-safado,events,about,contact,faq}` |
| Conta/Admin | seção 06 | `[CONFIRMAR]` | `/login`, `/user`, `/admin` | `src/app/login`, `src/app/user`, `src/app/admin/**` |

## 5. Inventário de componentes

| Componente do canvas | Estado atual | Ação |
|---|---|---|
| `Nav` | existe: `src/ui/nav/nav.tsx` + `nav-menu.tsx`, `nav-mobile-menu.client.tsx`, `search-nav.tsx`, `search-input.client.tsx`, `nav-scroll.client.tsx` | slice 02 ajusta tokens/geometria |
| `Footer` | existe: `src/ui/footer/footer.tsx`, `footer.client.tsx`, `newsletter.client.tsx`, `actions.ts` | slice 02 ajusta |
| `ProductCard` | existe (1 versão): `src/ui/products/product-card.client.tsx` | slice 03 unifica uso em home/catálogo/busca/relacionados |
| `Button` (3 tamanhos) | existe só base shadcn: `src/ui/shadcn/button.tsx`, sem tamanhos 56/48/44 nem `radius:0` herdado | slice 01 estende |
| `Field` (52px) | **não existe** como componente isolado — hoje é `input.tsx` + `label.tsx` soltos | slice 01 cria |
| `Badge/Tag` | existe: `src/ui/shadcn/badge.tsx`, `src/ui/status-badge.tsx` | slice 01 ajusta tokens |
| `PriceBlock` | **não existe** isolado — hoje é a classe `.price-font` aplicada ad-hoc | slice 01 cria componente |
| `CategoryFilterBar` | **não existe** | slice 03 cria |
| `CartLine` | **não existe isolado** — lógica dentro de `cart-sidebar.tsx` | slice 07 extrai |
| `OrderSummary` | **não existe isolado** — lógica dentro de `checkout-form.client.tsx` | slice 08 extrai |
| `AccordionStep` | **não existe** — checkout atual não é acordeão | slice 08 cria (usa `src/ui/shadcn/collapsible.tsx` de base) |
| `PaymentMethodTile` | **não existe isolado** — dentro de `mercado-pago-checkout-form.client.tsx` | slice 09 extrai |
| `TrustRow` | **não existe** | slice 09 cria |

## 6. Regras de negócio

- Categorias do canvas (`Livros, Edições sonoras, Zines & impressos, Objetos, Ingressos, Laboratórios`) **não existem no código hoje** — busca por essas strings não retornou nada em `src/lib/editorial-content-seed.ts` nem no restante do repo. Isso é mudança de escopo de dados, não só de UI — confirmar com produto antes do slice 03/05 (pode exigir slice extra de modelagem de categoria).
- Nav/footer devem dizer **"Loja"**, não "Livros" (conferir `nav.tsx`/`nav-menu.tsx` no slice 02).
- Frete calculado **no carrinho, antes do checkout** — hoje a cotação (Melhor Envio) acontece dentro do `/checkout`. Isso é mudança de fluxo, não só de layout — tratar como decisão de produto no slice 07 (modelo de raciocínio), documentar em `PROGRESS.md` antes de codar.
- Checkout convidado já implementado (sem login prévio, conta criada por magic link pós-compra) — preservar contrato, só re-skinar (ver `AGENTS.md` linha ~264).
- Mercado Pago é o único provider ativo (Pix + cartão via Payment Brick); `X-Idempotency-Key` reflete parâmetros reais da tentativa — não mexer nessa lógica nos slices de UI (08/09), só na apresentação.
- País travado em `Brasil/BR` em checkout/conta enquanto operação for nacional — não reintroduzir seletor de país.
