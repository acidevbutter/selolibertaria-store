# Correção de bugs de produção detectados — 2026-09-24

**Status:** planejado, não executado.

Duas tracks paralelas e independentes, cada uma em worktree própria (sem overlap de
arquivos entre elas). Bugs mapeados na sessão de QA manual de 2026-09-24 (mapeamento de
domínios/rotas + teste de fluxos admin/usuário logado pelo browser).

## Ordem

| # | Arquivo | Repo alvo | Worktree |
|---|---|---|---|
| 00 | `00-backend-track.md` | `selolibertaria/backend` | `.worktrees/prod-fixes-backend` |
| 01 | `01-store-track.md` | `selolibertaria-store` | `.worktrees/prod-fixes-store` |

## Fora de escopo desta série (decisão-gated ou não-código)

Não delegar ao Codex sem resolver antes:

- **backend#44** — site desativado não bloqueia checkout: decisão de produto.
- **backend#42 / #43** — valor mínimo de checkout Asaas: precisa confirmar valor real no
  dashboard Asaas antes de codificar.
- **backend#61** — saved-cards órfão: reconectar no front ou remover do backend, decisão.
- **store#158** — produto `little-fish-big-fish` faltando no catálogo de produção: é
  escrita em produção, precisa de execução/confirmação explícita do Marcos, não do Codex.
- **backend#46, backend#6, store#64, store#90** — configuração no painel do Coolify, não
  são bugs de código.

Nenhuma track desta série pode chamar API de produção, rotacionar segredo real, ou
escrever em banco de produção sem autorização explícita.
