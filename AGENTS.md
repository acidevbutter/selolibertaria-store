# AGENTS.md — Selo Libertária

This file guides Codex when working in this repository.

## Project identity

This repository is an inherited storefront/admin codebase that is being rebranded and adapted into **Selo Libertária**.

Treat all older storefront names, demo brands, starter examples, placeholder products, previous-site references and generic fork residue as legacy unless they are still required by code. New work should converge toward Selo Libertária.

## Product summary

Selo Libertária is not a pure brochure site and not a cold generic ecommerce store. It is a hybrid platform:

1. **Storefront** — books/products, catalog, PDP, cart, checkout, account, favorites and orders.
2. **Editorial layer** — home, about, contact, events, projects and Sarau Safado.
3. **Admin/backoffice** — dashboard, editorial hub, products, categories, orders, users, promotions, settings, emails, email templates and webhooks.
4. **Infrastructure/support flows** — MongoDB, Stripe, auth/session, shipping providers, email logs and webhooks.

Preserve the working commerce/admin architecture. Do not replace the app with static institutional pages.

## Development commands

Use Yarn Classic.

```bash
yarn install

yarn dev

yarn build
yarn start

yarn lint
yarn test
tsgo
```

Notes:

- Keep the package manager on Yarn Classic.
- Keep existing Next.js/App Router conventions.
- Keep Stripe and Mongo integrations server-safe.
- Do not introduce a second lockfile.
- When build/dev hangs, clear `.next/` before assuming application logic is broken.

## Current canonical public menu

The public header menu must be:

```text
Livros
Projetos
Sarau Safado
Sobre
Contato
```

Rules:

- `Comprar` is a CTA, not a menu item.
- `Eventos` may exist as a route/content area, but it is not a primary menu item.
- `FAQ`, `Termos` and `Privacidade` may appear in the footer or legal navigation, not in the main menu.
- Admin-only terms such as Dashboard, Pedidos, Mídia, Emails and Settings must never leak into the public menu.

## Route policy

Do not aggressively rename routes without a dedicated routing/SEO task.

Current route labels may be localized while preserving existing route paths. For example:

- `Livros` can point to the current catalog/products route.
- `Projetos` can point to `/projects`.
- `Sarau Safado` can point to `/sarau-safado`.
- `Sobre` can point to `/about`.
- `Contato` can point to `/contact`.

Only add aliases such as `/livros`, `/projetos`, `/sobre` and `/contato` if the task explicitly asks for redirect/canonical work.

## Visual direction

The active design direction is **Editorial V2**, a clearer implementation of **Editorial Noturno**.

Use:

- paper: `#F7F4EF`
- deep black: `#0B0B0B`
- dry wine: `#7A1E22`
- aged beige: `#D8D0C4`
- graphite/support darks when needed

The site should feel like a contemporary literary publisher/bookstore: adult, warm, cultural and editorial. Avoid:

- generic SaaS/dashboard look on public pages;
- childish, cute or pop visual language;
- sex-shop clichés;
- excessive ornamental effects;
- unrelated starter/demo assets.

## Figma guidance

Figma Prototype V2 is a visual reference, especially for:

- Home Desktop;
- Mobile Home;
- Book/PDP page;
- Admin editorial shell direction.

Do not copy absolute Figma-generated code. Translate the reference into reusable project components.

For the public home, prioritize:

1. Header
2. Hero with dominant book cover
3. Manifesto
4. Featured book section
5. Short catalog grid
6. Sarau Safado panel
7. Newsletter/footer

Avoid adding many extra blocks before the footer when the task is strict Figma fidelity.

## Public storefront rules

- Public copy for Selo Libertária should be `pt-BR` by default.
- Translate visible labels, placeholders, aria labels, empty states, loading states and errors when working on public localization.
- Do not auto-translate content authored in the admin; treat it as source content.
- Preserve catalog, cart, checkout, account and favorites.
- Books/products remain commerce entities; editorial content should contextualize them, not replace them.

## Editorial content rules

The editorial layer is already first-class and should not be recreated from scratch.

Existing editorial surfaces include:

- home
- about
- contact
- events
- projects
- sarau-safado

Admin editorial surfaces should follow the established pattern:

- store + fallback;
- admin form;
- publication/order metadata;
- public revalidation;
- safe fallback if Mongo is unavailable.

Do not move editorial collections into global `settings`. Keep events, projects and page content semantically separate.

## Admin rules

The admin should feel like an editorial backoffice, not a generic SaaS clone:

- fixed black sidebar;
- paper-like main surface;
- short hero/context per page;
- straight cards/panels;
- subtle wine accents;
- tables and forms with operational clarity.

Preserve existing queries, permissions and server actions. When updating legacy admin pages, wrap and polish before rewriting behavior.

Admin copy should be operational and clear. Prefer `Painel`, `Produtos`, `Pedidos`, `Usuários`, `Promoções`, `Configurações`, `Emails`, `Modelos de email`, `Webhooks` and `Editorial` over mixed English labels.

## Upload rules

For editorial/admin uploads:

- file picker first;
- local preview;
- confirmation modal with `Salvar` and `Descartar`;
- mode-aware behavior: `instant` vs `on-submit`;
- persist final URL only after the intended save/upload step.

For Sarau Safado hero image:

- one hero image only;
- replacing the image should replace the previous hero media, not build a gallery;
- public page should use it as a background/cover with contrast protection.

## Localization and currency

- Public Selo Libertária copy defaults to `pt-BR`.
- During public QA or temporary deploy stabilization, it is acceptable to force `pt-BR` at the locale resolver as long as the i18n architecture, message files and types remain intact.
- Keep i18n architecture intact; do not hardcode locale where the app already resolves it.
- Do not expose raw API errors to users if a local translated message/code exists.
- Admin and storefront dates/currency should respect the resolved locale and environment currency.
- Do not add a general currency selector unless the task explicitly concerns multi-currency support.

## Safety against fork residue

When touching files, remove or replace visible residue from previous forks/starter sites when it is in scope:

- old brand names;
- demo product names such as generic T-shirt/poster examples;
- placeholder metadata;
- starter slogans;
- unrelated store copy;
- duplicated/obsolete locale files;
- raw English labels in `pt-BR` surfaces.

Do not remove functional code only because a name is old. First verify whether it is visible copy, metadata, asset reference, or required implementation detail.

## Validation checklist

Before closing a task, run what is available:

```bash
yarn lint
yarn test
yarn build
tsgo
```

If a command is unavailable or hangs, report it explicitly with the last useful output.

Also validate:

- public menu labels;
- direct route reloads;
- mobile header/menu;
- no horizontal overflow;
- CTA behavior;
- checkout/cart untouched unless the task targets them;
- admin forms still save;
- no visible fork/demo residue in touched surfaces.

## AI patterns

- 2026-06-24: public navigation must stay identical across desktop and mobile with only `Livros`, `Projetos`, `Sarau Safado`, `Sobre` and `Contato`; keep `Comprar` as a separate CTA and never leak `Eventos`, `Início` or dynamic categories into the primary public menu.
- 2026-06-24: when polishing public storefront copy, prefer `livros` over generic `produtos` in search, catalogue and empty-state labels, and route fallback CTAs toward primary editorial surfaces such as `Projetos` instead of promoting `Eventos` in the main navigation path.
- 2026-06-24: public editorial pages after Home should follow the Editorial V2 hierarchy of one dominant hero, one short explanatory band, a concise content block and a single strong closing CTA strip before the newsletter/footer; avoid stacking many generic panels.
- 2026-06-24: in the public header, the final CTA must be session-oriented (`Entrar`, `Conta` or `Minha conta`) and never `Comprar`; purchase language belongs to product and catalog surfaces, especially the PDP.
- 2026-06-24: the PDP should read like a page of a book turned into commerce: cover-led hero, compact buy box, synopsis above the fold, dark excerpt band, factual technical details only, and related books with clear `Ver livro` continuity.
- 2026-06-25: when the public deploy drifts into `en-US`, freeze locale resolution at the server boundary instead of deleting i18n; cookies, `Accept-Language` and old locale prefixes may keep existing redirects, but the rendered storefront should stay in `pt-BR`.
- 2026-06-25: `/events` should behave like an editorial agenda page, not a grid of generic cards: full-width dark hero, curatorial note, horizontal agenda rows, archive/memory cards and one closing continuity strip before the footer.
- 2026-06-25: the locale contract is now `pt-BR` only across storefront and admin shell; ignore `Accept-Language`, ignore locale cookies, collapse legacy `/en`, `/en-us`, `/es` and `/pt-br` prefixes into canonical routes, and never reintroduce public English fallback copy.

@RTK.md
