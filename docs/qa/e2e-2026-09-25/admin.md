# Admin panel — Playwright e2e results (2026-09-25)

Suite: `e2e/journeys/admin/**` (nav-smoke, guards, crud-smoke), plus a shared
admin-session setup helper. Exercised against the live local stack
(`localhost:3001` frontend, `selolibertaria-backend-api`, local Postgres,
Mailpit) as an ADMIN account registered through the real `/login` form.

**How to re-run:**

```
yarn test:e2e e2e/journeys/admin
```

or directly: `npx playwright test e2e/journeys/admin`.

## Environment note (read before triaging "failed" rows below)

This machine was under heavy, sustained load for the whole session (`uptime`
load averages around 12–13, well above what a normal dev box carries), most
likely from other concurrent agent/tool activity sharing it. Running the
**full** suite back-to-back in one process occasionally produced transient
failures that are clearly infra/tooling noise, not product bugs:

- Playwright itself intermittently failed to write its own trace/screenshot
  artifacts (`ENOENT ... test-results/.playwright-artifacts-N/traces/...`)
  under disk/CPU contention — always on a *different*, otherwise-passing
  route each time, never reproducible when that same route was re-run alone.
- One `net::ERR_CONNECTION_REFUSED` / one `net::ERR_EMPTY_RESPONSE` on the
  dev server, and a couple of Next.js dev-mode "first compile of this route
  is slow" timing misses.
- One single-occurrence login redirecting to `/` instead of `/admin`
  immediately after `promoteToAdminInDb` — DB state confirmed the account
  *was* already `ADMIN` at that point; never reproduced again across ~15
  other setup runs, so treated as a one-off under extreme load rather than
  a real race in the setup helper.

Every route/feature below was independently re-verified in isolation (single
test or small `-g` grep subset) at least once, several multiple times, with
tracing off to rule out the artifact-writer noise. The **only** finding that
reproduced consistently, every single time, in isolation and in every full
run, is `/admin/editorial/projects/new` (row below, and bug #1).

## Summary table

| Route / journey | Result | Notes |
|---|---|---|
| `/admin` (dashboard) | PASS | |
| `/admin/products` | PASS | |
| `/admin/products/new` | PASS | |
| `/admin/products/categories` | PASS | |
| `/admin/products/[slug]` (`little-fish-big-fish`) | PASS | |
| `/admin/editorial` | PASS | |
| `/admin/editorial/about` | PASS | |
| `/admin/editorial/blocos` (bare index) | PASS | redirects to `/admin/editorial`, as coded |
| `/admin/editorial/blocos/home` | PASS | |
| `/admin/editorial/contact` | PASS | |
| `/admin/editorial/events` | PASS | |
| `/admin/editorial/events/new` | PASS | |
| `/admin/editorial/events/[slug]` | SKIPPED | no real event exists in the DB (`editorial_content` has 0 rows) — see crud-smoke below, which *does* exercise this page via its own created event |
| `/admin/editorial/global` | PASS | |
| `/admin/editorial/home` | PASS | |
| `/admin/editorial/pagina-do-produto` | PASS | |
| `/admin/editorial/products` | PASS | |
| `/admin/editorial/projects` | PASS | |
| **`/admin/editorial/projects/new`** | **FAIL — real bug** | see Bug #1 below; 100% reproducible |
| `/admin/editorial/projects/[slug]` | SKIPPED | no real project exists in the DB; strongly suspected to share Bug #1 (same form component) — noted in the filed issue |
| `/admin/editorial/sarau-safado` | PASS | |
| `/admin/media` | PASS | |
| `/admin/orders` | PASS | |
| `/admin/orders/[id]` (`ord_52a5953bbd1643b5a8a265e0ef002fe7`) | PASS | |
| `/admin/promotions` | PASS | |
| `/admin/pre-venda` | PASS | |
| `/admin/users` | PASS | |
| `/admin/users/[id]` (a real existing user) | PASS | |
| `/admin/emails` | PASS | |
| `/admin/email-templates` | PASS | benign sandboxed-iframe console warning explicitly excluded — see note in nav-smoke.spec.ts |
| `/admin/webhooks` | PASS | |
| `/admin/settings` | PASS | |

## Auth/role guard verdict (two distinct cases, not collapsed)

- **Unauthenticated → `/login`**: PASS. A fresh, cookie-less context hitting
  `/admin` or any `/admin/*` subpage (tested `/admin/orders`) redirects to
  `/login`, consistently, every run.
- **Wrong role (CUSTOMER) → `/forbidden`**: PASS. A logged-in CUSTOMER
  account (registered fresh, deliberately never promoted) visiting `/admin`
  redirects to `/forbidden`, **not** `/login` — confirmed via an explicit
  `not.toHaveURL(/\/login/)` assertion alongside the positive check, so the
  two cases can't silently collapse into one another.

## CRUD-smoke verdict

**PASS.** Created an editorial event titled `[E2E] Evento <suffix>` via
`/admin/editorial/events/new`, confirmed it appears in `/admin/editorial/events`
and on its own detail page, then deleted it via the UI's own destructive
action (confirm() dialog accepted) and confirmed it's gone from the list.
The DELETE actually reaches the FastAPI backend (`deleteEditorial`) — this
isn't a soft-delete or a client-only optimistic removal.

One real UI issue surfaced along the way — see Bug #3 below — worked around
in the test by invoking the button's DOM `.click()` directly instead of a
coordinate-based click.

## Bugs found (GitHub issues filed; org policy — file per bug, close if
resolved in this same slice)

None of these were fixable within this task's scope (only
`e2e/journeys/admin/**` and this report were writable), so **all are left
open**.

1. **selolibertaria-store#177 — `/admin/editorial/projects/new` crashes: `editorial-project-form.tsx` is missing `"use client"`.**
   Confirmed root cause: `src/app/admin/editorial/_components/editorial-project-form.tsx`
   defines local `handleSlugInput`/`handleSlugBlur` functions and passes them
   as `onInput`/`onBlur` props to a plain `<Input>`, exactly like its sibling
   `editorial-event-form.tsx` — but unlike that sibling, it's **missing the
   `"use client";` directive** (compare the two files' first lines). Without
   it, Next.js treats the module as a Server Component, and passing event
   handlers as props from a Server Component throws at runtime:
   `Error: Event handlers cannot be passed to Client Component props.` The
   page falls straight into the global error boundary
   (`src/app/error.tsx`, "Ooops, algo deu errado!") on every load — this
   route is currently unusable. 100% reproducible, every attempt.
   **Fix:** add `"use client";` as line 1 of `editorial-project-form.tsx`.
   Also worth checking `/admin/editorial/projects/[slug]` once fixed (same
   form component, no real project existed in the DB to verify directly).

2. **selolibertaria-store#178 — floating "Salvar evento" bar overlaps and blocks the sidebar's Publicar/Excluir buttons.**
   On `/admin/editorial/events/[slug]` (and structurally the same for the
   projects equivalent), `EditorialFloatingSaveBar` is `fixed inset-x-4
   bottom-4 z-50` for the whole page, and can sit on top of the sidebar's
   "Ações" card (`EditorialItemActions`'s publish/delete buttons) at normal
   viewport heights. Confirmed via Playwright's own actionability retries
   ("`... subtree intercepts pointer events`") and by observing that even
   `.click({ force: true })` still landed on the overlay instead of the
   button (force-click is still coordinate-based). Worked around in
   `crud-smoke.spec.ts` by invoking the button's DOM `.click()` method
   directly, which bypasses hit-testing but still fires the real handler.

3. **selolibertaria-store#176 — `RegisterForm`'s final-step submit button isn't disabled while the request is in flight.**
   `pending` in `register-form.client.tsx` is wired from a prop that's only
   ever set by the *login* form's own submit handler, never by
   `RegisterForm.handleSubmit` itself — so the "Criar conta" button stays
   fully clickable during its own in-flight request. Observed as two
   `POST /api/auth/register` calls (confirmed via network logging and
   backend logs: two distinct `request_id`s ~550ms apart, the second a
   `500 IntegrityError` on the unique email constraint) from what was
   intended as one click.

4. **selolibertaria_backend#67 — `RELAY_PROJECT_ID` empty locally silently disables all transactional email.**
   Blocked the documented "verify via Mailpit" step for admin setup:
   registration succeeds, but no verification email ever reaches Mailpit —
   not a timing flake, a confirmed permanent no-op. Root cause: the backend
   container's `RELAY_PROJECT_ID` env var is empty, so `RelayClient.enabled`
   is `False` and `NotificationService._send` returns immediately with no
   log, no error, no `communications` row. Staging/production/preview
   `.env.*.example` files all set `RELAY_PROJECT_ID=selolibertaria`; the
   local `.env.example` leaves it blank.

5. **selolibertaria_backend#68 — `POST /auth/login` never checks `user.verified`.**
   Turned up while working around #67: a freshly-registered, never-verified
   account can log in and use the site exactly like a verified one —
   `AuthService.login` checks password hash and `blocked_at`, but nothing
   reads `verified`. Flagged as a product/security question rather than an
   assumed bug (verification might be intended only for deliverability, not
   as an access gate) — filed for a deliberate call either way.

**How this suite adapted to #67 + #68:** the shared admin-session helper
(`e2e/journeys/admin/support/admin-session.ts`) still *attempts* the
Mailpit-based verification (short 6s timeout, since it's a confirmed
permanent no-op here, not worth the full 15s), but doesn't fail setup if
nothing arrives — it just logs in directly afterwards, which works because
of #68. This is the only place the suite deviates from the originally
documented "register → verify via Mailpit link → promote → login" flow, and
it's clearly commented in the source as to why.

## Leftover test data

- `e2e.admin.*@selolibertaria.com.br` and `e2e.customer-guard.*@selolibertaria.com.br`
  rows accumulated in `users` across setup/debugging runs during this
  session (each full suite invocation registers a fresh pair, since the
  email is derived from a per-process run id). Per the task's own
  instructions these are fine to leave — clearly named, harmless. Not
  cleaned up as part of this deliverable.
- The crud-smoke spec cleans up its own `[E2E] Evento ...` editorial row via
  the real UI delete action every run; verified no `[E2E]`-titled rows are
  left in `editorial_content` as of the end of this session.
- No products, orders, non-e2e users, categories, or other editorial content
  were created, modified, or deleted.

## Files

- `e2e/journeys/admin/support/admin-session.ts` — shared admin/customer-guard
  session setup (register → best-effort verify → promote (admin only) →
  login), memoized per worker process and cached to disk via
  `.auth/*.json` storageState files, exposed as Playwright `storageState`
  fixture overrides (not a static `test.use()` + `beforeAll`, which raced —
  see the file's own comments for why).
- `e2e/journeys/admin/nav-smoke.spec.ts` — full route sweep.
- `e2e/journeys/admin/guards.spec.ts` — auth/role guard contract.
- `e2e/journeys/admin/crud-smoke.spec.ts` — create → verify → delete smoke
  on an editorial event.
