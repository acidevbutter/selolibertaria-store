# Company / stack context

**Selo Libertária** — e-commerce store + admin panel, built by DevButter (Marcos Pereira).

## Repos in this working directory
- `selolibertaria-store/` — Next.js frontend (yarn, Biome lint, Vitest), dev on port 3001
  (admin-refactor worktree dev server on port 3002).
- `backend/` — FastAPI backend, follows the `fastapibuilder-api` pattern (Poetry, async
  SQLAlchemy 2.0 + Alembic, Pydantic v2). Dev Postgres reachable at `localhost:5436` from
  worktrees (docker-internal hostname `shared-postgres` only resolves inside containers).
- `.worktrees/` — short-lived and slice-scoped worktrees for parallel work (see glossary).
- `docs/` — architecture notes, design docs, QA notes.

## Payments
Asaas is the live payment integration, via a proxy-mTLS architecture (the old direct-relay /
mock-mode approach was intentionally removed — don't propose restoring it).

## Conventions
- File a GitHub issue for bugs found during work; close it when fixed in the same session.
- FastAPI work follows the `fastapibuilder-api` skill/pattern strictly.
