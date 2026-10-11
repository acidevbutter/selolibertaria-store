# Glossary

- **Fatia** — a slice/phase of the admin design-refactor project (numbered 00, 01, 02, 03, 04, 05...),
  each with its own design canvas reference and sub-prompts (e.g. 05.1-05.8).
- **Turno** — a numbered design pass/session in the Claude Design project; "Turno 4" = the Oficina v2
  editor screens covered by fatia 05.
- **Oficina v2** — v2 admin design system, overrides v1 inside `/admin` only.
- **contentDoc** — jsonb structured document (11 fixed node types) replacing free-HTML editorial content.
- **DCC Ash** — typeface being phased out of `/admin`, replaced by IBM Plex Mono for all data/values.
- **Canvas (.dc.html)** — a design-reference file living in the Claude Design project "Selo Libertaria"
  (project id `51b9f903-a7c6-4eaa-9119-fff9c168518f`), fetched via DesignSync — not copied into the repo.
- **butter_blob** — the image/blob storage backend service used for media uploads.
- **fastapibuilder-api pattern** — the org-mandated FastAPI project structure/conventions
  (Poetry, async SQLAlchemy 2.0 + Alembic, Pydantic v2, decorator-driven routers, per-domain
  router/schemas/models/service/repository layout) — see the `fastapi-builder` skill.
