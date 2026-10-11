# Memory

## Me
Marcos Pereira (DevButter), building/maintaining Selo Libertária — an e-commerce store + admin
panel. Works via git worktrees for parallel backend/frontend slices; branches off `staging`.

## People
| Who | Role |
|-----|------|
| **Marcos** | Owner/dev, DevButter. Also commits as "DevButter" (shared account). |

## Terms
| Term | Meaning |
|------|---------|
| **Fatia** | A slice of work in the admin design-refactor project — one design/implementation prompt with its own acceptance criteria (e.g. fatia 00 = tokens, 01 = media library, 02 = editor de blocos, 05 = Oficina v2 editor). |
| **Oficina v2** | The v2 admin design system (Turno 4), which overrides `admin-design-system.md` (v1) specifically inside `/admin`. Public store keeps v1. |
| **contentDoc** | The structured jsonb document model (11 node types: heading, paragraph, list, quote, highlight, image, gallery, button, divider, productShelf, agenda) replacing free HTML in editorial content. |
| **DCC Ash** | A typeface being removed from `/admin` in favor of IBM Plex Mono for all data display. |
| **Canvas** | A `.dc.html` file in the Claude Design project "Selo Libertaria" — design reference, not code to copy directly. |
| **butter_blob** | The blob/image storage service the backend uploads media to. As of 2026-09-19, `butter_blob-api`/`butter_blob-worker` run locally and `BUTTER_BLOB_SERVICE_API_KEY` is configured — real uploads work end-to-end in local dev (verified via `MediaService.upload()`). Corrects an earlier note that said this was blank/untestable (see [[selolibertaria-backend20]] for that prior context). |

## Projects
| Name | What |
|------|------|
| **Admin design refactor** | Multi-fatia rebuild of `/admin` on a new design system. Fatia 00-01 done & merged; 02 (editor de blocos) implemented but unmerged (`feature/admin-design-refactor`, `feature/editorial-content-doc`); 03-05 pending. See [[admin-design-refactor-status]] and [[admin-worktree-pattern]] in deep memory. |
| **Asaas payment proxy** | Checkout payment flow via a proxy-mTLS architecture (direct/mock mode removed). See [[asaas-payment-proxy-cutover]] in deep memory. |

## Preferences
- Follow the `fastapibuilder-api` pattern for all FastAPI backend work (org-level instruction).
- File a GitHub issue for any bug found; close it in the same session if resolved.
- Backend work: use short-lived worktrees off the live checkout's HEAD, merge back into the
  checkout the docker volume tracks (not staging) — see [[admin-worktree-pattern]].
- Frontend admin-refactor work happens in `.worktrees/admin-design-refactor` (branch
  `feature/admin-design-refactor`, off `staging`, port 3002).
- Fatia 05 branches off `admin-design-refactor` rather than waiting for 00-02 to merge to staging
  (2026-09-14 decision).
- Deeper, cross-session memory (project history, incidents, corrected assumptions) lives in
  Claude Code's own auto-memory at `~/.claude/projects/.../memory/` — check `MEMORY.md` there for
  the full index; this file is the quick-glance summary.
