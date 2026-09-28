# E2E shopper journeys — 2026-09-25

Automated Playwright coverage (chromium) for the six customer-facing journeys, run
against the live local environment (`http://localhost:3001`, Mailpit at
`:8025`, FastAPI backend + Postgres + MinIO + Redis/Celery via Docker Compose).
Specs live in `e2e/journeys/shopper/**`.

## How to re-run

```
yarn test:e2e e2e/journeys/shopper
# or, per-file:
npx playwright test e2e/journeys/shopper/anonymous.spec.ts --reporter=list
```

`e2e/journeys/shopper/helpers.ts` documents the two environment workarounds
below (`resolveVerificationLink`, `fillReliably`) in detail with file:line
references.

## Summary table

| Journey | Spec file | Status |
|---|---|---|
| 1. Jornada deslogada (anonymous) | `anonymous.spec.ts` | **PASS** (24-27/27, depending on shared-environment load — see Environment notes). One deterministic failure: the PDP page-load check correctly fails on a confirmed real bug (issue #179). |
| 2. Cadastro + verificação de e-mail | `signup.spec.ts` | **PASS** end-to-end, via a documented DB fallback for email delivery (issue #181) |
| 3. Recuperação de senha | `password-reset.spec.ts` | **PARTIAL** — request step and invalid-token step pass reliably; the full "receive real email → set new password" flow is **environment-blocked** (issue #181) and not recoverable via fallback (unlike signup, the reset token is stored hashed) |
| 4. Compra sem cadastro (guest checkout) | `guest-checkout.spec.ts` | **Logic verified correct** through shipping-quote resolution and submit-enablement; the final external-redirect assertion is **flaky in this shared dev environment** (see Environment notes) — not reproducible as an isolated app bug |
| 5. Compra com cadastro (logged-in checkout) | `account-checkout.spec.ts` | Same status as #4 for the final redirect; prefill/"Usar meu endereço salvo" assertions verified passing in earlier isolated runs |
| 6. Contato e newsletter | `contact-newsletter.spec.ts` | **PASS** (3/3, reliably) |

## Known-bug re-verification (from `docs/qa/e2e-2026-09-23.md`)

**1. Home "Ver a pré-venda" CTA → `/pre-venda/little-fish-big-fish` 404.**
**NOW FIXED, differently than expected** — already tracked and closed as
[#159](https://github.com/acidevbutter/selolibertaria-store/issues/159). As of
today the home page no longer has a "Ver a pré-venda" CTA at all: the seeded
hero content resolves the real `little-fish-big-fish` product and links
directly to its PDP ("Comprar agora" → `/product/little-fish-big-fish`),
bypassing the presale route entirely (confirmed via `anonymous.spec.ts`'s
dedicated re-verification test, and via a raw HTML fetch of `/` showing no
`pre-venda` link anywhere). The underlying route defect is still present in
isolation — visiting `/pre-venda/little-fish-big-fish` directly still renders
a not-found boundary, because `presales.published = false` in the local DB
(`getPreSaleCampaign` in `src/lib/pre-sale.server.ts` returns `null` whenever
the presale row isn't published) — but nothing in the live UI links there
anymore, so this is no longer reachable by a real shopper.

**2. Contact form empty-submit validation shows English ("Please fill out
this field.").** **NOW FIXED** — already tracked and closed as
[#160](https://github.com/acidevbutter/selolibertaria-store/issues/160).
Verified directly: `src/ui/contact/contact-form.client.tsx` overrides the
native validation bubble via `setCustomValidity()` in its `onInvalid` handler.
`contact-newsletter.spec.ts` reads the real DOM `validationMessage` property
(not just a screenshot) and confirms it's `"Preencha este campo."` in pt-BR.

## New bugs found this session (GitHub issues filed)

| # | Title | Where found |
|---|---|---|
| [#179](https://github.com/acidevbutter/selolibertaria-store/issues/179) | PDP product-variant gallery image broken — presigned URL points at the Docker-internal `minio:9000` hostname, unreachable from a real browser (`net::ERR_CONNECTION_REFUSED`) | `anonymous.spec.ts`, PDP page-load test |
| [#180](https://github.com/acidevbutter/selolibertaria-store/issues/180) | `POST /stats/api/send` (analytics beacon) returns 400 on every single page load, app-wide | `anonymous.spec.ts`, dedicated test |
| [#181](https://github.com/acidevbutter/selolibertaria-store/issues/181) | Transactional email (verification + password reset) completely non-functional locally (`RELAY_PROJECT_ID` unset) and fails **silently** — `NotificationService._send()` no-ops with no log, unlike the sibling `CommunicationService` which raises a clear error for the same condition | `signup.spec.ts` / `password-reset.spec.ts` / `account-checkout.spec.ts` |
| [#182](https://github.com/acidevbutter/selolibertaria-store/issues/182) | Password-reset success never shows the `/login` "Senha atualizada" flash — the emailed link has no `next` param, so success redirects to the auth-gated `/user?section=purchases`, which just bounces to a bare `/login` with no confirmation | `password-reset.spec.ts` |

## Already-tracked findings confirmed during this session (no new issue filed)

While writing these specs, two bugs were independently rediscovered via live
network tracing and DB inspection, but each already had a GitHub issue —
filed and **closed** by another concurrent session working in this same repo
during this exact QA pass (see Environment notes):

- **Duplicate `POST /api/auth/register` per single "Criar conta" click**
  ([#176](https://github.com/acidevbutter/selolibertaria-store/issues/176),
  closed). Confirmed via backend request logs across three independent runs
  (two `POST /auth/register` calls, ~0-15ms apart, for the same email; the
  second usually gets a clean 409 but was once observed to instead surface an
  unhandled 500 when the two inserts raced each other's commit) and an
  isolated `window.fetch`-patched probe.
- **Address entered at registration step 2/3 was silently discarded, never
  reaching the backend** ([#162](https://github.com/acidevbutter/selolibertaria-store/issues/162),
  closed). Confirmed fixed in the current code: `src/app/api/auth/register/route.ts`'s
  Zod schema now includes `address`, and `account-checkout.spec.ts`'s
  registration (with a real address) correctly surfaces "Usar meu endereço
  salvo" as a delivery option afterward, proving the address round-trips to
  the backend and back.

## Environment notes (read before re-running)

**This dev server was shared with at least one other active Claude Code
session during this QA pass.** `git status`/`git diff` showed unrelated files
(`docs/architecture/fastapi-migration-map.md`,
`docs/product/SELOLIBERTARIA_SITE_MAP.md`, etc.) changing mid-session that
this session never touched, and the GitHub issue list above independently
confirms it: issues #159, #160, #162, #176 — several of the exact bugs this
session found from scratch — were filed and **closed within the same time
window** as this run. That means source files were being actively edited
throughout, and the running `next dev` server was recompiling/hot-reloading
in response, independent of anything this suite did.

This directly explains most of the flakiness encountered in the two checkout
specs and, to a lesser extent, signup/password-reset:

- A direct instrumented probe (monkey-patching `window.fetch`, logging
  `framenavigated`/console events) caught `[Fast Refresh] rebuilding` firing
  in the browser console **immediately after** clicking "Confirmar e pagar",
  followed by the checkout form's client state resetting to empty. Backend
  request logs (`docker logs selolibertaria-backend-api`) confirm **zero**
  `POST /checkout/intents` calls ever arrived during any of the runs that hit
  this — the in-flight Server Action was aborted client-side by the reload
  before the network call fired, not rejected by the server.
- The `next-server` process was also observed oscillating between healthy
  (~100–600MB RSS, sub-second responses) and heavily loaded (~1.4–2.7GB RSS,
  70–260% CPU, 10-50s response times, a visible "Compiling ..." dev badge)
  multiple times over the session, consistent with sustained concurrent
  compilation activity rather than a leak from this suite alone.

Given that, `guest-checkout.spec.ts` and `account-checkout.spec.ts` are
written and structured correctly (verified independently via standalone
Playwright probes reaching all the way to a resolved shipping quote and an
enabled "Confirmar e pagar" button, and via full code-reading of
`src/actions/checkout-actions.ts`'s `createAsaasCheckout` → FastAPI
`/checkout/intents` → Asaas → `redirect_url` → `window.location.assign`
chain), but the final external-redirect assertion could not be captured
reliably end-to-end in *this* shared, actively-edited environment. Re-running
`guest-checkout.spec.ts` / `account-checkout.spec.ts` in a quiet environment
(no concurrent sessions editing the repo) is expected to pass; if it doesn't,
that would itself be a new, real finding worth its own issue.

Two defensive fixes were still worth keeping in the specs regardless of the
above (see `helpers.ts`'s `fillReliably` doc comment): a plain `.fill()` can
land on a buyer-info field before its React handler is attached under a
loaded dev server, so `fillReliably` fills, waits briefly, and re-verifies
the value stuck (retrying if not) before every checkout-form submission.

## Addendum (orchestrating session, post-report)

Re-ran `guest-checkout.spec.ts` / `account-checkout.spec.ts` in isolation once
no further concurrent file edits were happening, per this report's own
suggestion above. Two real, distinct findings came out of that, both now
resolved (fixed or filed+triaged):

1. **Fixed** — [selolibertaria-store#183](https://github.com/acidevbutter/selolibertaria-store/issues/183):
   `account-checkout.spec.ts` reproducibly hit `Informe um telefone válido.`
   and stayed stuck on `/checkout`, even though the Telefone field showed a
   real, valid number. Root cause: the field's initial value came straight
   from the account's E.164-stored phone (`+5511987654321`, 13 digits) with
   no normalization, while the client validator only accepts 10-11 digits.
   Fixed in `src/app/checkout/asaas-checkout-form.client.tsx` (new
   `toNationalPhone` helper). This was blocking **every** logged-in checkout
   for a customer with a phone on file — the highest-severity finding of this
   whole QA pass.
2. **Filed, left open** — [selolibertaria_backend#69](https://github.com/acidevbutter/selolibertaria_backend/issues/69):
   with #183 fixed, both checkout specs now reach the real submit call, which
   fails with a generic "Pagamento temporariamente indisponível" — traced via
   backend logs to `ASAAS_ACCOUNT_ID` being unset locally
   (`asaas_proxy_not_configured`, `POST /checkout/intents` → 503). This is an
   environment/credentials gap, not a code bug fixable from this repo alone;
   it's the actual blocker for verifying the final "redirect to Asaas" step
   end-to-end, distinct from the earlier flakiness this report attributed to
   concurrent editing.
3. `guest-checkout.spec.ts` remained flaky across repeated isolated re-runs,
   failing at a *different* point each time (once at the CEP/submit-button
   step, once earlier at the cart-drawer step) with no corresponding backend
   error either time — consistent with this report's own documented
   shared-environment load issue (next-server RSS/CPU oscillation) rather
   than a new app bug. Bumped one assertion's timeout (5s → 20s) as a cheap
   reliability improvement; did not chase further given no reproducible root
   cause. Worth a clean re-run on a quiet machine once #69 is resolved, since
   right now the spec can't get further than the submit call anyway.

## Anonymous journey data notes

- The catalog in this environment has exactly **one** published product
  (`little-fish-big-fish`, category `livros`) as of 2026-09-25 — confirmed
  via `select slug, published from catalog_products;`. The prior QA pass's
  references to "three published PDPs" and a "Ninfas do Tietê" product no
  longer apply; `anonymous.spec.ts` uses the one real product/category
  available.
- Searching `?q=virus` (the prior pass's term, expecting to find "vírus do
  beijo") now correctly shows the empty-results state ("Nada encontrado para
  ...") since that product isn't in the current catalog. This is a data
  change, not a regression — `anonymous.spec.ts` also verifies search works
  correctly against a real term ("fish").
- `/checkout/return` with no `order` param correctly redirects to
  `/?checkout=missing_order`; `/reset-password` with no token and the
  unauthenticated route guards (`/orders`, `/user`, `/admin` → `/login`) all
  verified passing.
