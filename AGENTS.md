# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

DevButterStore is a Next.js 16 storefront and admin application integrated with Stripe for catalog and payment flows. It is built with React 19, TypeScript, and Yarn Classic on Node.js 24.

## Development Commands

### Package Management & Installation
```bash
yarn install                   # Install dependencies
```

### Development Server
```bash
yarn dev                      # Start development server
```

### Building & Production
```bash
yarn build                    # Build for production
yarn start                    # Start production server
```

### Code Quality & Testing
```bash
yarn lint                     # Run Biome linter/formatter (auto-fix)
yarn test                     # Run Vitest tests
tsgo                         # TypeScript type checking (use tsgo command)
```

### Docker
```bash
yarn docker:build           # Build Docker image
yarn docker:run             # Run Docker container
```

## Architecture & Structure

### Core Technologies
- **Framework**: Next.js 16 with App Router
- **Runtime**: React 19 with React Compiler enabled
- **TypeScript**: Strict configuration with path aliases
- **Styling**: Tailwind CSS v4 with Radix UI components
- **State Management**: React Context for cart functionality
- **Payment Processing**: Stripe integration via commerce-kit
- **Testing**: Vitest with Testing Library
- **Linting**: Biome (replaces ESLint/Prettier)

## AI Patterns

- Prefer Yarn Classic (`yarn@1.22.22`) for dependency management and scripts.
- Para redesigns guiados por referência visual, especialmente no Selo Libertária, consolidar primeiro um sistema reutilizável de componentes e tokens; na trilha `Editorial V2`, usar papel `#F7F4EF`, preto profundo `#0B0B0B`, vinho seco `#7A1E22`, bege envelhecido `#D8D0C4`, capas grandes, serifas editoriais e bastante respiro, sem copiar código absoluto gerado pelo Figma.
- Quando o admin do Selo Libertária receber atualização guiada por Figma, traduzir a referência em primitives reutilizáveis de backoffice antes de estilizar páginas isoladas; o shell esperado é sidebar preta fixa, conteúdo em papel claro, hero introdutório por tela, cards retos e tabelas com acento vinho discreto.
- Na Goal 2 do admin, quando migrar superfícies legadas como `emails`, `webhooks` ou `users`, preservar queries, permissões e componentes de dados existentes, trocando primeiro o enquadramento para `AdminEditorialPage` + `AdminEditorialHero` + `AdminEditorialStat` + `EditorialPanel` antes de reabrir comportamentos internos.
- Na Goal 3 guiada por Figma, preferir uma motion layer pequena e reutilizável com `framer-motion`, respeitando `prefers-reduced-motion`; aplicar reveals discretos e hover lifts leves em home, PDP e superfícies editoriais antes de considerar animações mais complexas.
- Na Goal 4 do admin, o foco principal passa a ser usabilidade operacional: corrigir erros de runtime reproduzíveis primeiro, aplicar i18n corretamente em todo o backoffice seguindo por padrão o idioma resolvido a partir do ambiente/configuração ativa, eliminar a mistura acidental entre inglês e `pt-BR` e introduzir autoformatação nos campos de formulário sempre que isso reduzir erro de preenchimento sem esconder o valor real persistido.
- Na Goal 4 do admin, moeda não deve aparecer como configuração editável de settings nem como escolha operacional geral: nesta fase o backoffice assume apenas a moeda definida pelo ambiente, e a futura conversão entre moedas fica para a etapa final do projeto.
- Na Goal 6 do admin, tratar o shell de navegação como sistema compartilhado: sidebar desktop, sheet mobile, estado ativo, marca, sessão, agrupamento de itens e metadados de capacidade devem nascer de funções e primitives únicas, para evitar drift visual entre menus laterais e páginas.
- Na Goal 6 do admin, validar sempre o shell refinado em viewport desktop e mobile antes de fechar a rodada; sinais como heading sobreposto no hero, áreas em branco inesperadas, links sem hierarquia suficiente ou duplicação entre `sidebar.client.tsx` e `topbar.client.tsx` contam como regressão estrutural do backoffice.
- Em detalhes administrativos como `/admin/users/[id]` e `/admin/orders/[id]`, a continuação da Goal 2 e da Goal 3 deve manter queries e ações existentes, mas enquadrar perfil, resumo, fulfillment e auditoria em blocos editoriais com copy operacional em `pt-BR` e reveals leves por seção.
- Na Goal 1 de conexão total com o backend, concentrar a decisão de fallback editorial em `src/lib/editorial-content-store.ts`: superfícies públicas devem priorizar documentos publicados do Mongo, e o admin deve ler o backend canônico com fallback seguro apenas quando a coleção estiver indisponível ou vazia.
- When a workflow needs local productivity context and no native connector is available, prefer small AppleScript-backed helpers in `scripts/` plus a concise repo note such as `MAC_AUTOMATIONS.md`; they must degrade gracefully when macOS Calendar or Reminders permissions are unavailable.
- For personal automation flows that coordinate multiple repositories, keep the source of truth in a parent-level `projects.json`, read it through a repo script instead of hardcoding one project path, and rank active work by deadline pressure plus explicit priority before generating daily briefs or focus blocks.
- Quando a tarefa pedir um briefing de UI/UX ou uma descrição funcional ampla do produto, consolidar o inventário de funcionalidades em `spec.md` e manter `UI_UX_PATTERNS.md`, `userinterface.md` e `userexperience.md` alinhados com esse retrato.
- Ao estreitar coleções derivadas de `FormData` com type predicates, preserve exatamente as uniões opcionais e anuláveis do objeto de entrada, ou normalize os valores antes do `filter`, para manter o `yarn build` e a checagem de TypeScript consistentes localmente e na Vercel.
- Quando `src/lib/authz.ts` expuser aliases legados por compatibilidade, mantenha imports e chamadas novos no nome canônico com casing exato, especialmente em Server Actions, para evitar falhas de TypeScript que só aparecem no `yarn build` da Vercel.
- Treat the repository as a reusable storefront starter: keep brand copy, visuals, icons, contact data, and metadata generic unless a task explicitly introduces a new store identity.
- The default placeholder brand is `Storefront`; prefer neutral descriptions, neutral assets, and replaceable examples over niche editorial narratives.
- When a task explicitly targets the Selo Libertaria rebrand, implement it as a hybrid editorial storefront: preserve the current store architecture, cart, checkout, account, and admin flows while layering institutional pages, cultural programming, and author-driven content on top instead of replacing commerce with a brochure site.
- When a task explicitly targets the Selo Libertária rebrand, prefer an `Editorial Noturno` direction by default: warm deep tones, adult editorial tension, cultural sophistication, and modern bookstore energy without sex-shop clichés or childish cues.
- Alternative visual studies for the Selo Libertária rebrand may use `Barroco Contemporâneo` or `Urbano Sensual Minimalista`, but do not blend multiple art directions in the same surface without an explicit decision.
- Keep `packageManager` pinned to `yarn@1.22.22`, but keep `engines.yarn` broad enough for Vercel's Yarn Classic `1.22.19` installer (`>=1.22.19 <2`) so deploys do not fail before install.
- Target Node.js 24 locally via `.nvmrc`; the repo also accepts Node.js 25 through `engines`.
- Keep `yarn build` on `next build --webpack` until the custom `webpack` configuration is migrated away.
- Na Goal 1 de ligação completa das páginas ao backend, preferir ampliar o uso do `editorial-content-store` com fallbacks centralizados e revalidação explícita do hub `/admin/editorial`, evitando leituras diretas ao Mongo nas páginas quando já houver helper canônico reutilizável.
- Quando já existir configuração operacional persistida em `settings`, como `supportEmail`, superfícies públicas devem priorizar esse documento antes de recorrer a constantes de marca em `selolibertaria-content`.
- Use Vitest with `jsdom` for unit tests; do not reintroduce alternate runtime-specific tooling or extra lockfiles.
- For dependency security fixes, verify active advisories against official sources before bumping Next.js, remove unused vulnerable packages when possible, and prefer pinned `resolutions` for safe transitive patches.
- Public Stripe catalog reads used by store pages, search, or sitemap must degrade gracefully during build/runtime misconfiguration by returning empty results or `null`, while checkout and write paths should still fail explicitly.
- Shipping calculations must go through an internal provider adapter layer with a single storefront contract; admin users can choose the active provider and fallback order, but the checkout should never call Correios, Jadlog, or another carrier API directly.
- Shipping provider settings must preserve typed presets for `Correios`, `Jadlog`, `EasyPost`, and `Custom HTTP`, with masked credentials at rest, provider-specific endpoint fields in admin, and server-side request/auth builders isolated from checkout UI.
- Admin settings must expose a global `shippingEnabled` switch that disables all shipping calculations, including manual flat-rate providers and API-backed providers, before cart or checkout attempt any quote resolution.
- Conteúdo editorial institucional do Selo Libertária, como `events`, `projects`, `sarau-safado`, `about`, `contact` e futuros blocos da home, deve migrar de constantes estáticas para documentos versionáveis em Mongo com fallback seguro para `src/lib/selolibertaria-content.ts` enquanto a transição não estiver completa; o admin deve editar esse conteúdo por coleções/tipos explícitos, com auditoria de `updatedAt`/`updatedBy`, publicação e ordenação, em vez de misturar esses campos no documento global de `settings`.
- Ao iniciar a camada editorial editável do Selo Libertária, sempre prever uma etapa de bootstrap/migração inicial que leia os mocks existentes em `src/lib/selolibertaria-content.ts` e os grave em Mongo de forma idempotente, para que o admin não comece vazio e o storefront possa trocar para leitura dinâmica sem perder conteúdo.
- Conteúdo editorial do Selo Libertária que aceite imagem, como eventos, projetos, Sarau Safado e futuros blocos institucionais, deve reutilizar o mesmo pipeline de upload, preview e persistência de URL já usado para imagens de produto; o fluxo principal do admin deve ser `upload-first`, deixando URL manual apenas como fallback técnico.
- Quando o `Sarau Safado` tiver `hero.image` cadastrada no admin, a página pública deve tratar essa mídia como capa de fundo do hero, com gradiente de legibilidade e bloco textual sobreposto; a ausência de imagem deve manter um fallback editorial consistente, sem quebrar a hierarquia.
- O hero editorial do `Sarau Safado` aceita apenas uma imagem no admin; o seletor deve operar em modo de capa única, substituindo a mídia anterior em vez de acumular galeria.
- Em superfícies editoriais com upload `on-submit`, confirmar a prévia no modal deve apenas manter a seleção pendente no formulário; o upload definitivo e a persistência no documento acontecem somente no submit principal da página.
- A página pública de `sarau-safado` deve ser tratada como leitura editorial sempre fresca do documento administrável, sem depender de uma versão estática antiga depois de edições no backoffice.
- Nos formulários editoriais do Selo Libertária, seleção de imagem pode operar em modo `on-submit`: a pessoa escolhe o arquivo, vê a prévia local e conclui o upload ao salvar o formulário; não dependa exclusivamente de auto-upload imediato nesses formulários.
- Em fluxos administrativos de upload por arquivo, a seleção de imagem deve abrir um modal de revisão com prévia ampliada e ações explícitas de `Salvar` ou `Descartar`; só depois dessa confirmação o sistema deve manter a seleção pendente ou iniciar o upload, conforme o modo da tela.
- Na fase editorial do Selo Libertária, `events`, `projects` e `sarau-safado` já devem ser tratados como superfícies administráveis de primeira classe no backoffice; novas páginas institucionais devem seguir o mesmo padrão de `store + fallback + formulário admin + revalidação pública`, em vez de criar constantes novas acopladas à UI.
- O backoffice editorial do Selo Libertária deve ter um hub próprio em `/admin/editorial` e mostrar metadados operacionais simples, como publicação, ordem e última atualização, nas superfícies de edição; isso reduz atrito sem exigir uma camada pesada de auditoria antes da hora.
- Splash screens ou overlays globais nunca devem interceptar interação em `/admin` ou `/login`; essas superfícies precisam abrir diretamente utilizáveis, sem camada transitória bloqueando clique, upload ou submit.
- Depois de `events`, `projects` e `sarau-safado`, páginas institucionais como `about` e `contact` também devem entrar no mesmo circuito editorial administrável, preferindo documentos de página estruturados em Mongo, seed idempotente a partir dos mocks existentes e leitura pública com fallback seguro.
- Blocos institucionais da home do Selo Libertária, especialmente `hero`, `manifesto`, `autora` e `CTA final`, também devem seguir o circuito editorial administrável em Mongo; preserve `events`, `projects` e catálogo como fontes separadas, em vez de colapsar a home inteira em um único texto rígido.
- Na home do Selo Libertária, se o admin já persiste `author`, `community` ou mídia editorial de destaque, a página pública deve renderizar esses blocos integralmente; evitar salvar campos no backoffice que depois não aparecem no storefront.
- Em coleções editoriais ordenáveis, como `events` e `projects`, o admin deve oferecer pelo menos reordenação básica por mover para cima/baixo antes de considerar interações mais pesadas como drag-and-drop; a ordem persistida em Mongo precisa refletir imediatamente no storefront.
- User-facing copy should default to English across storefront, admin, transactional emails, and i18n fallbacks unless a task explicitly requires another locale; when normalizing mixed-language UI, also update related email templates, placeholders, and status messages in the same pass.
- For the Selo Libertária rebrand, `pt-BR` is the primary public storefront language; new public-facing copy must go through the existing i18n layer and keep `en-US` as a secondary translation instead of leaving hardcoded English in the UI.
- Quando corrigir textos públicos do storefront para `pt-BR`, passe tanto por strings visíveis quanto por rótulos de acessibilidade, placeholders, toasts e fallbacks; conteúdo digitado e gerido pelo admin deve permanecer intocado e não entrar em normalização automática de tradução.
- Storefront locale resolution must remain route-stable: prefer request-aware fallback order of explicit locale override, supported browser/device language, admin-configured default locale, then `NEXT_PUBLIC_LANGUAGE`; optional locale-prefixed entry URLs such as `/en`, `/pt-br`, or `/es` may be used only as a cookie-setting shortcut and must redirect immediately to the canonical unprefixed URL.
- Admin regional settings should own the default storefront locale and default country, while account/login/checkout/cart surfaces, product pricing, and user-facing dates must format from the resolved request locale.
- Customer-facing currency should resolve from the authenticated user's saved `preferredCurrency` when present, otherwise from a guest preference cookie or locale-derived fallback; storefront pricing and Stripe checkout/payment intent amounts may switch to that currency only when the underlying Stripe Price supports the target currency via `currency_options`, otherwise they must fall back safely to the product's default currency.
- Public build surfaces that depend on Mongo-backed catalog metadata, such as `sitemap.xml` category URLs, should also degrade gracefully to empty lists instead of failing the build when Mongo is unavailable.
- For favicon or branding icon updates, configure `icons` in `src/app/layout.tsx` to point at the canonical asset in `public/` and remove conflicting App Router icon files when needed.
- The canonical favicon, Apple touch icon, and deployment-facing site icon must resolve from the generic `public/images/storefront-mark.svg` placeholder until a real brand asset replaces it.
- Admin product management must write to Stripe only from server-only code paths; storefront products are grouped by `metadata.slug`, and variants remain separate Stripe Products/Prices with matching `metadata.slug` plus `metadata.variant` and `metadata.variant_order`.
- Admin bootstrap and reseed flows should use `yarn seed:admin`, sourcing `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_PHONE`, and `ADMIN_VERIFIED` from `.env`, and the script must stay idempotent by upserting the user and preserving unrelated profile data.
- Admin product screens should render Stripe image URLs through a shared preview component in both catalog listings and edit forms, with a visible empty-state fallback when a product or variant has no images.
- Admin product image forms should support repeated `images` fields in the UI, and server actions should parse them with `formData.getAll("images")` so multiple URLs remain first-class across create and update flows.
- Variant admin flows should inherit group-level name, slug, category, description, images, and order automatically; the editor should focus on `variant`, `variant_order`, stock, active state, and pricing mode (`inherit` vs `override`).
- Admin product creation and edit flows should present product data in short, clearly labeled sections such as shared details, pricing, variant details, and availability instead of one long undifferentiated form.
- Admin product status copy must stay business-facing: use `Active`, `Inactive`, or `Deactivate` language and never expose implementation labels such as `Active in Stripe` in the UI.
- Admin variants should remain scannable from the product page as summary cards or rows, while create and edit actions open in focused modals; avoid tab-heavy editors that hide context when the product has many variants.
- Product categories are system records in Mongo; admin product forms must use a selector backed by those records, Stripe-derived categories should auto-sync into Mongo by name/slug without duplicating existing entries, and category renames should keep Mongo and Stripe aligned.
- Admin image uploads may use a third-party media service such as Cloudinary as an optional ingress layer, but the existing Stripe catalog flow must remain URL-based: uploads should end by filling the same `images` fields and saving those URLs back through the current Stripe product actions.
- Admin product image management should use a file-picker-first workflow with uploaded previews and hidden submitted URLs; do not expose manual image URL inputs in the product editor UI.
- Product image migrations should run through an explicit script, upload any legacy remote Stripe image URLs to the managed media service, and then update Stripe products to reference only the managed URLs so reruns can safely skip already migrated images.
- Product images that still point at Stripe-hosted URLs should remain renderable in both the storefront and admin by bypassing Next image optimization for those hosts, while the migration script should fetch the remote bytes and re-upload them to the managed media service before rewriting Stripe product image URLs.
- Storefront product galleries with multiple images should present carousel-style navigation plus an enlarged view whose zoom follows cursor movement, in the style of an e-commerce inspection experience.
- Storefront product-list cards should support direct quick actions from the grid: keep the whole card navigable to the PDP, float the favorite action in the top-right corner, and surface a compact add-to-cart control over the media that stays accessible on hover, focus, and touch devices.
- Storefront product-list cards must keep square corners on the outer card and media container; preserve existing rounded treatments only for internal controls such as favorite buttons, quick-add pills, and variant chips.
- Storefront product-list cards must preserve a uniform footprint across the grid; title, price, and variant areas should reserve consistent space, while product imagery adapts inside the fixed media frame instead of resizing the card.
- Storefront product-card titles should read larger than the surrounding pricing copy and remain easy to scan within a two-line clamp.
- Storefront quick-add should favor a compact floating `+` control in the product image area, keeping the idle state icon-only and expanding to `Add to cart` on hover/focus with smooth easing over at least `1s`; when expanded on a red fill, its text should be black. When a product has multiple variants, the card itself should expose a direct variant selector that updates the chosen option and displayed pricing before add-to-cart.
- Active variant chips in storefront product cards may use a saturated red fill with black label text, as long as the selected state remains clearly legible and transitions in with a light expansion effect.
- O footer público da storefront deve preservar a linha de copyright e métodos de pagamento, e quando houver crédito de desenvolvimento ele deve aparecer na faixa inferior como lockup inline discreto com link externo, ícone da marca e nome visível, sem competir com CTAs nem com os ícones de pagamento.
- Cupons e promoções devem ser modelados em Mongo como regras versionadas, auditáveis e agendáveis, mantendo a Stripe como fonte canônica apenas do preço-base e do catálogo; toda elegibilidade e todo preço efetivo devem ser resolvidos no servidor e congelados em snapshots de `orderDrafts` e compras.
- Superfícies públicas que exibem promoções devem degradar com segurança para o preço-base Stripe quando Mongo ou o motor promocional estiverem indisponíveis; checkout, aplicação de cupom e confirmação de pagamento devem falhar de forma explícita se não conseguirem validar a regra promocional no servidor.
- Favoritos devem ser persistidos fora do carrinho, com chave por `userId` + `product slug` + variante opcional, e alertas de desconto para itens favoritados devem respeitar consentimento explícito de marketing, deduplicação por usuário/item/campanha/preço efetivo e auditoria completa na coleção `communication`.
- O catálogo público deve aplicar apenas promoções automáticas no nível de leitura (`commerce.product` / `commerce.variant`), preservando em cada variante `pricing.basePrice`, `pricing.effectivePrice`, `pricing.discountAmount` e `appliedPromotions`; cupons continuam exclusivos do carrinho e do checkout.
- O carrinho deve persistir `couponCode` tanto no documento `users.cart` quanto no cookie do carrinho convidado, e toda leitura de carrinho precisa reconstruir subtotal base, desconto total, total final e promoções aplicadas no servidor antes de renderizar sidebar, checkout ou snapshots.
- A operação administrativa de promoções deve viver em `/admin/promotions`; promoções automáticas ativas podem enfileirar alertas para favoritos em `promotionNotifications`, e o disparo desses emails deve exigir `marketing.email.optIn`, email verificado e registro auditável em `communication` com template `favorite-discount-alert`.
- O cadastro administrativo de cupons deve expor e persistir, no mínimo, janela de validade, limite total de uso, limite por cliente, subtotal mínimo, restrição à primeira compra, exigência de email verificado e regra de acúmulo com promoções automáticas; essas restrições precisam ser resolvidas integralmente no servidor antes da confirmação do checkout.
- A edição administrativa de promoções e cupons em `/admin/promotions` deve ser atômica entre `promotions` e `promotionCodes`, permitir ajuste posterior de código, validade e elegibilidade, e manter o `kind` original imutável para evitar migrações implícitas entre promoção automática e cupom.
- Formulários administrativos longos, especialmente em `/admin/promotions`, devem agrupar campos por categoria em seções tipo sanfona com títulos e descrições curtas; o objetivo é reduzir carga cognitiva, evitar blocos contínuos de inputs e preservar uma UI limpa sem esconder a ação principal.
- Mutações de carrinho que dependem de cookie, como aplicar ou remover cupom em carrinho convidado, devem sincronizar imediatamente no client o `Cart` retornado pela Server Action; não dependa apenas de um refetch instantâneo em `/api/cart`, porque a propagação do `Set-Cookie` pode momentaneamente expor um carrinho vazio.
- O documento canônico de padrões gerais de interface e experiência passa a ser `UI_UX_PATTERNS.md`; padrões especializados, como autenticação social em `AUTH_SOCIAL_BUTTON_PATTERN.md`, devem permanecer sincronizados com esse retrato do produto atual.
- Vercel-triggered product image migrations should be gated in code by `VERCEL=1`, `VERCEL_ENV=production`, and `RUN_PRODUCT_IMAGE_MIGRATION=true`, with the normal `yarn build` path otherwise continuing straight to `next build --webpack`.
- Git commit message formatting should not be enforced by commit hooks in this repository; keep pre-commit quality checks if desired, but do not require conventional commit messages.
- Build orchestration should try `scripts/seed-admin.mjs` before compiling on Vercel production so the first deploy can bootstrap an admin automatically, skip it outside that environment, and continue the build with explicit logs if the seed or media migration cannot complete.
- When removing template leftovers or rebranding the project, eliminate legacy author, vendor, demo, and upstream boilerplate references from UI, metadata, documentation, and package/container names in the same pass.
- Documentos comerciais voltados para cliente devem viver em `documentacao/`, com texto em `pt-BR`, tom humano e não técnico, versão final em PDF e arquivo-fonte editável para reaproveitamento posterior.
- If the current task is scoped to technical requirements only, preserve the existing storefront UI and avoid voluntary visual or copy changes outside strictly technical fixes.
- Stripe transparent checkout should use PaymentIntent plus Stripe Elements/Payment Element inside the site UI, keep all price and cart validation on server-only code paths, reuse or update an existing intent per cart whenever possible, never expose secret keys or log `client_secret`, and treat signed webhooks as the source of truth for order finalization.
- Stripe webhook ingestion must persist every received attempt in Mongo, including signature failures and malformed payloads, and the admin area should expose a dedicated Webhooks screen for inspection.
- Stripe purchase reconciliation must not rely on Mongo positional projection or updates matched through ambiguous related-id filters alone; resolve the purchase in application code first, then update by the concrete `purchases.id`.
- Transparent checkout order state should persist a Mongo `orderDrafts` snapshot before payment confirmation, keyed by `paymentIntentId` and cart hash, so webhooks and browser return flows can reconcile orders without reading a mutable cart after payment.
- Admin order details should persist an explicit audit log for internal fulfillment edits, recording actor, role, timestamp and before/after values for status and tracking changes, and the order screen should expose that history below the operational form.
- Audit history in admin order details should refresh immediately after a fulfillment save and present changes in human-readable before/after blocks instead of raw JSON so an operator can audit quickly.
- Order status transitions applied automatically by payment webhooks must also be written to `orderAuditLogs` with timestamp, webhook event id, webhook type, source marker, and before/after payment status so the admin order screen can audit automated changes alongside manual ones.
- Legacy checkout success toasts and cart cleanup must only react to Checkout Session query params; the transparent checkout `payment_intent` flow owns `/checkout/processing` and must not be interrupted by global URL handlers.
- Saving Stripe payment methods must be opt-in with explicit customer consent in the checkout UI, update `setup_future_usage` only from server-side code before confirmation, and expose only safe card metadata such as brand, last4, and expiry when listing saved methods.
- Transparent checkout must expose an explicit choice between existing saved payment methods and entering a new payment method, confirming the `PaymentIntent` with the selected saved `payment_method` id when the customer chooses reuse.
- Orders created from Stripe `PaymentIntent` flows must use an internal application order id such as `ord_...` as the canonical `purchases.id`; Stripe ids like `pi_...` should remain only in related technical fields such as `paymentIntentId` and `relatedIds`.
- Saved payment methods must be manageable from the user account menu, with authenticated list/remove flows that detach Stripe PaymentMethods from the current user's Stripe Customer and never expose full card data.
- Checkout and cart Server Components must treat cookies as read-only during render; any guest-cart merge or cart-cookie cleanup that calls `cookies().set`, `cookies().delete`, or helpers such as `clearCartId()` must run inside a Route Handler or a client-invoked Server Action.
- Customer transactional emails for orders must map raw Stripe/admin statuses into customer-facing phases, avoid duplicate sends for equivalent payment transitions such as `paid` and `succeeded`, and persist the last sent notification metadata on the purchase for auditability.
- Customer-facing email templates should use a neutral branded shell that can be re-skinned later without structural rewrites; prefer simple typography, light surfaces, and the generic placeholder mark until a real brand is provided.
- Todo email transacional persistido em Mongo deve registrar assunto, destinatário, status, tipo/template e contexto útil de auditoria, e o admin deve expor uma tela dedicada para consultar esse histórico com filtros e vínculo para usuário ou pedido quando houver.
- A listagem administrativa de emails deve permitir selecionar um registro e abrir um popup com a prévia renderizada do conteúdo, preservando no modal os metadados principais do envio para auditoria rápida.
- A grade administrativa de emails deve permanecer enxuta; detalhes extensos, incluindo erro de envio, tentativas e contexto técnico, devem aparecer prioritariamente dentro do popup do registro selecionado.
- O sistema de email deve permanecer desacoplado de fornecedor específico: tentar SMTP primeiro e, em caso de falha, usar um fallback externo opcional configurado por variáveis de ambiente, registrando no log qual provedor foi usado e as tentativas anteriores.
- No fallback do Brevo, campos opcionais como `cc`, `bcc` e `replyTo` devem ser omitidos do payload quando estiverem vazios, porque arrays vazios podem gerar `400 missing_parameter` na API.
- O admin de emails deve permitir reenviar um registro diretamente da listagem ou do popup, usando o conteúdo persistido daquele log e criando uma nova tentativa auditável sem sobrescrever o histórico original.
- O fluxo automático de envio deve priorizar a via de API configurada antes do SMTP; no admin, as retentativas precisam oferecer um botão explícito para `API` e outro para `SMTP`, enquanto o popup informa qual via efetivamente enviou a mensagem.
- Authentication forms should expose stable `id`/`name` pairs plus browser-standard `autocomplete` tokens such as `username`, `current-password`, `new-password`, `name`, `tel`, and address tokens so Chrome can save both credentials and profile data; when the registration flow stays client-side, also attempt `navigator.credentials.store()` after a successful signup.
- Login flows that are expected to trigger Chrome password-save should prefer a classic browser form POST plus server redirect/cookie response over a Server Action redirect; Credential Management API fallbacks may remain in place, but the browser-native POST flow is the reliable primary path.
- For Chrome password-save compatibility, the login form should expose the identifier field as `name="username"` with `autocomplete="username"` and submit to a page-style POST route such as `/login/submit`, instead of an `/api/...` endpoint, before redirecting server-side.
- Password login must accept legacy user records whose `users.email` was stored with mixed casing, matching e-mail case-insensitively on authentication and normalizing the stored value back to lowercase after a successful login.
- Invalid or legacy `session` cookies must fail closed and be cleared quietly during auth checks instead of spamming logs or trapping the user in a broken login state.
- Registration and profile forms should reuse shared country-aware primitives for phone, postal code, and address fields, prefilling data when possible but always degrading gracefully to manual entry when a lookup provider fails or is unavailable.
- Brazilian CEP lookup fields should trigger automatically when eight digits are entered, fill street, neighborhood, city, and state from the postal provider when available, keep lookup status text outside the field grid so address inputs remain visually aligned, and use a secondary provider fallback before degrading to manual entry.
- Brazilian address forms should keep postal-provider fields separate from manual fields: CEP fills `line1` as rua/logradouro, `district` as bairro, `city`, and `state`, while `number` and `complement` remain manually entered.
- For Brazilian addresses, a successful CEP lookup should disable manual editing of `line1`, `district`, `city`, and `state` until the CEP changes or the lookup state is cleared; only `number` stays required for manual entry and `complement` remains optional.
- Advanced registration work should preserve the current custom Mongo-backed session architecture by default; add social provider identities and account-linking on top of the existing session/user model unless a full auth-stack migration is explicitly approved.
- Prefer a phased social-auth rollout centered on broadly supported consumer providers such as Google, Apple, and Facebook first; treat Instagram as a separate Meta integration with provider-specific eligibility and review constraints instead of assuming it behaves like generic consumer login.
- OAuth providers should be governed from the admin settings area: admins can enable or disable each provider there, and provider credentials should be managed from that panel with secure server-side storage and masked readback instead of relying only on raw environment variables.
- OAuth provider start, callback, and completion routes must stay explicitly public in `src/proxy.ts`; otherwise the global API guard will return `401 Unauthorized` before the OAuth handshake begins.
- OAuth provider credentials managed in admin must be persisted encrypted at rest in Mongo with reversible server-side decryption derived from `JWT_SECRET`; decryptors should remain backward-compatible with older ciphertext formats during key-derivation transitions.
- On the login screen, OAuth actions should render below the primary email/password submit button, and each provider button should reuse a matching SVG from `public/images/icons/` when that asset exists.
- The social-login cluster on the login screen should follow `AUTH_SOCIAL_BUTTON_PATTERN.md`: centered single-column rail, shared max width, 44px buttons, visually centered labels, and Google rendered on a light surface that stays compliant with its branding rules.
- No rebrand `Editorial V2`, a tela de `/login` deve abandonar o card genérico centralizado e assumir composição editorial de página inteira: header do sistema, bloco textual à esquerda, formulário em superfície de papel com cantos retos, trilho social logo abaixo do submit e uma capa/livro protagonista em painel escuro à direita.
- No fluxo de cadastro dentro de `/login`, preferir uma jornada editorial em etapas curtas (`Conta`, `Entrega`, `Preferências`) em vez de um formulário longo e simultâneo; a primeira etapa deve pedir apenas o essencial para reduzir abandono.
- Phone and address defaults should come from admin-configured regional settings, and the phone input should show a country/DDI selector beside the number field, start from the admin default country, and update the phone mask based on the currently selected country.
- In the transparent checkout flow, the browser return must treat a freshly submitted order as `pedido recebido` and may send that email immediately, but it must not treat `payment_intent.succeeded` as final payment confirmation or clear the cart before the Stripe webhook processes and confirms the payment server-side.
- The `/checkout/processing` screen must degrade gracefully when the browser-side `payment_intent` sync fails or the customer returns without a valid session cookie: keep a success-like return (`checkout=success|succeeded|processing`) in a non-error processing state and let the webhook-backed order status be the source of truth.
- The `/checkout/processing` screen must never spin forever: poll the browser-sync status only for a short bounded window, stop immediately on authoritative dispute/review states, and redirect to the orders area after at most `15s` if no final confirmation arrives.
- Dashboard, badges, and customer order surfaces must normalize raw dispute aliases such as `under_review`, `warning_under_review`, `needs_response`, `warning_needs_response`, and `warning_closed` into stable product states (`disputed`, `won`, `lost`) so old or third-party-originated records remain visible and actionable.
- Browser-side checkout sync may use `payment_intent.status === succeeded` to end the waiting UI, but it must still preserve any already authoritative persisted states such as disputes, refunds, or fulfillment transitions instead of overwriting them.
- Transactional order-status emails must preserve semantic order: send `received` / payment-under-review updates before any payment-confirmed (`paid` / `succeeded`) message for the same purchase, including webhook-driven and legacy upsert flows.
- Stripe dispute events such as `charge.dispute.created`, `charge.dispute.updated`, and `charge.dispute.closed` must be consumed as first-class webhook states on the existing purchase, without reinterpreting the underlying `PaymentIntent` away from `succeeded`; browser sync must never downgrade a webhook-confirmed or dispute-related purchase status back to `processing`.
- Admin dashboard work must aggregate metrics from the full filtered purchase dataset, not from a recent-user sample, and should separate payment funnel, fulfillment queue, financial KPIs, and operational health signals such as webhooks and transactional email failures.
- Na Goal 2 do admin guiada por Figma, começar pelo shell compartilhado e pelo cockpit de `/admin`: sidebar preta de `264px`, links em pills claros com ponto de estado, topbar curta por tela, quatro métricas com barra lateral de cor, fila operacional em coluna principal e cartões auxiliares à direita para preview/atividade; usar apenas dados reais do sistema, nunca placeholders numéricos fictícios.

### Directory Structure
```
src/
├── app/                     # Next.js App Router pages
│   ├── (store)/            # Store route group with layout
│   ├── api/                # API routes (auth, chat, webhooks)
│   └── login/              # Authentication pages
├── actions/                # Server actions
├── context/                # React Context providers (cart, modals)
├── i18n/                   # Internationalization (client/server)
├── lib/                    # Utilities, types, auth, search
├── ui/                     # Reusable UI components
│   ├── shadcn/             # Shadcn/ui components
│   ├── checkout/           # Checkout-specific components
│   ├── nav/                # Navigation components
│   └── products/           # Product-related components
```

### Key Architectural Patterns
- **Route Groups**: `(store)` group for main store pages with shared layout
- **Server Components**: Extensive use for performance optimization
- **Server Actions**: Form handling and data mutations
- **Dynamic Routes**: `[slug]` for products and categories
- **Parallel Routing**: Modal implementations using `@modal` slots

### Path Aliases
- `@/*` → `./src/*`
- `@ui/*` → `./src/ui/*`
- `@/components/ui/*` → `./src/ui/shadcn/*`

## Environment Configuration

### Required Environment Variables
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_CURRENCY` - Currency code (e.g., "usd")
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `NEXT_PUBLIC_URL` - Store URL (optional on Vercel)

### Optional Environment Variables
- `ENABLE_STRIPE_TAX` - Enable Stripe Tax calculations
- `STRIPE_WEBHOOK_SECRET` - For Stripe webhook handling
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` - Analytics tracking
- `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` - Newsletter signup endpoint
- `NEXT_PUBLIC_LANGUAGE` - Locale (defaults to "en-US")

## Code Style & Standards

### Biome Configuration
- **Indentation**: Tabs, width 2
- **Line Width**: 110 characters
- **Quotes**: Double quotes for JS/JSX
- **Trailing Commas**: Always
- **Semicolons**: Always required
- **Arrow Parentheses**: Always

### TypeScript Standards
- Strict mode enabled with additional strictness (`noUncheckedIndexedAccess`)
- No unused locals enforced
- Import type enforcement for type-only imports
- Path aliases configured for clean imports

## Testing

- **Framework**: Vitest with React Testing Library
- **Setup**: Global test setup in `src/setup-tests.ts`
- **Pattern**: `**/?(*.)test.?(c|m)[jt]s?(x)`
- **Mocking**: Automatic mock clearing/resetting between tests

## Commerce Integration

### Stripe Integration
- Products managed in Stripe Dashboard with metadata
- Required metadata: `slug` (for URLs)
- Optional metadata: `category`, `order`, `variant`
- Webhooks handle payment events and cache revalidation

### Search Functionality
- Simple search implementation for products
- Search functionality in `src/lib/search/`

## Key Development Notes

- Use server components by default, client components only when necessary
- Leverage Next.js 16 features; `next dev` already uses Turbopack by default
- Commerce Kit handles Stripe integration abstractions
- Internationalization ready with message files in `/messages`
- Docker-ready with standalone output mode
- Git hooks configured with Husky for commit linting
- don't use `yarn dev`; I have the server running in the background all the time, just ask about checking if needed
- Backoffice authorization must evolve through a server-side capability matrix instead of spreading new `role === ...` checks; when adding internal roles such as `vendor`, preserve the current session architecture, centralize guards in helpers, and make all admin pages, route handlers, and server actions validate explicit capabilities.
- Internal operator roles such as `admin` and `vendor` must never act as storefront buyers: cart mutations, coupon application, checkout intent/session creation, and purchase persistence must fail explicitly on the server for those roles while keeping customer flows unchanged.
- The current Stripe-backed admin catalog is global by default; do not introduce per-user product ownership unless the requirement explicitly needs scoped catalog visibility beyond role-based operational permissions.
- Only `admin` may manage staff governance, including promoting or demoting roles and blocking or unblocking user access; those changes must revoke active sessions for the target user immediately, and the system should prevent an admin from accidentally removing or blocking the last active admin account.
- `vendor` may access catalog management and perform product and variant create/update/archive flows through the same server-only Stripe admin actions as `admin`; every catalog mutation must append an auditable history entry with actor, role, timestamp, target slug, and a concise change summary.
