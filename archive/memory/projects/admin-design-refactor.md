# Admin design refactor

Multi-fatia rebuild of the `/admin` panel in `selolibertaria-store`, driven by design prompts in
the Claude Design project "Selo Libertaria" (`docs/prompts/*.md` there, project id
`51b9f903-a7c6-4eaa-9119-fff9c168518f`).

## Status (as of 2026-09-14)
- **00 (design system tokens)** — done, merged.
- **01 (Mídia e Imagem — library, crop panel)** — done, merged.
- **02 (editor de blocos — contentDoc schema + renderer + block editor w/ undo-redo)** — implemented
  but NOT merged to staging. Lives across:
  - `feature/editorial-content-doc` (schema, 02.1)
  - `feature/admin-editor-blocos` / `feature/admin-design-refactor` (renderer 02.2, editor 02.4)
- **03 (promoções), 04 (navegação e listas)** — not started.
- **05 (Oficina v2 + Editor, turno 4)** — spec received 2026-09-14, not started. Decision: branch
  off `admin-design-refactor` rather than waiting for 00-02 to merge to staging.

Sub-prompts for 05: 05.1 tokens/layers, 05.2 AdminSidebar+topbar+breadcrumb, 05.3 "+" menu (11
block types), 05.4 toolbar/block-bar/undo, 05.5 drag-to-insert image, 05.6 crop-in-editor overlay,
05.7 states/microcopy, 05.8 edit-on-page (etapa 2, only after 02.2 and 05.5 exist).

## Known blocker
`selolibertaria_backend#20` — `BUTTER_BLOB_SERVICE_API_KEY` blank in local dev, so real image
uploads can't be verified end-to-end (affects 05.5/05.6 testing too, not just fatia 01).

## Worktrees in use
`.worktrees/admin-design-refactor`, `.worktrees/admin-editor-blocos`, `.worktrees/editorial-content-doc`
in this repo directory — see [[../glossary]] and the deep-memory `admin-worktree-pattern` /
`admin-design-refactor-status` entries for the docker/migration gotchas.
