# Docs — Selo Libertária

Índice dos documentos do projeto. Raiz do repo mantém apenas o que ferramentas externas esperam ali: `README.md`, `AGENTS.md`, `CLAUDE.md`, `CHANGELOG.md`, `LICENSE-*`.

## design/
Direção visual, padrões de UI e UX ativos.
- `UI_UX_PATTERNS.md` — regras completas de UI/UX (fonte canônica de padrões visuais).
- `userinterface.md` — resumo rápido de decisões visuais, histórico de atualizações por data.
- `userexperience.md` — fluxos e decisões de experiência do usuário.

## product/
Escopo, mapa do site e backlog.
- `spec.md` — escopo de produto.
- `site-overview.md` — visão geral do site e próximos passos.
- `SELOLIBERTARIA_SITE_MAP.md` — mapa de rotas/telas.
- `TODO.md` — backlog ativo (P0, P1, P2…).

## patterns/
Padrões de implementação reutilizáveis.
- `AUTH_SOCIAL_BUTTON_PATTERN.md`
- `RTK.md`

## comercial/
Material comercial/institucional (não técnico).
- `proposta-comercial-selo-libertaria.md` / `.pdf`
- `selolibertaria_planner_p0b_launch.md`
- `gerar_proposta_cliente.py`

## Outras pastas já existentes (não tocadas nesta reorganização)
- `architecture/` — mapas de arquitetura (ex.: migração FastAPI).
- `diagrams/` — diagramas `.mmd`.
- `mercado-pago-orders-api-migration/` — migração da API de pagamentos.
- `prompts/` — prompts de execução por slice/tarefa (inclui `fastapi-bff-migration/`).
- Arquivos soltos: `checkout-orders-runbook.md`, `catalog-migration.md`, `mercado-pago-sandbox-test.md`, `font-accent-coverage-issue.md`.

## prompts/ — implementação do novo design (Claude Design)
Ver `prompts/00-INDEX.md` para o plano de slices que traduz o Canvas Selo Libertaria (Claude Design) em PRs mergeáveis.
