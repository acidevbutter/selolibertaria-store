# 00 — Corrigir bugs de produção detectados: backend

**Repositório alvo:** `selolibertaria/backend`, em `.worktrees/prod-fixes-backend`
(worktree curto, branch nova a partir do HEAD do checkout que o docker volume rastreia —
merge de volta nesse mesmo checkout ao final, não em `staging`).

## Escopo

Corrigir, uma por vez, com commit e teste próprios para cada issue:

1. **acidevbutter/selolibertaria_backend#10** — `ASAAS_ACCOUNT_ID` sumiu dos quatro
   templates `.env.*.example` (`.env.example`, `.env.preview.example`,
   `.env.production.example`, `.env.staging.example`), mas `AsaasProxyClient` continua
   exigindo o valor em toda chamada. Adicionar `ASAAS_ACCOUNT_ID=` de volta aos quatro
   arquivos com um comentário explicando que é obrigatório.

2. **acidevbutter/selolibertaria_backend#29** — `docker-entrypoint.sh` tem
   `# alembic upgrade head` comentado, contradizendo o comentário acima dele que descreve
   migrations rodando automaticamente. Decidir: (a) descomentar a linha, se for seguro
   rodar migrations a cada boot neste setup; ou (b) reescrever o comentário para refletir
   a realidade (migrations são manuais). Documentar a escolha no commit.

## Restrições

- Não tocar #44, #42, #43, #61 (saved-cards) — fora de escopo, decisão de produto pendente.
- Não chamar API de produção da Asaas.
- Não rodar migrations contra banco de produção.
- Rodar `poetry run pytest`, `poetry run ruff check .` e `poetry run mypy app` antes de
  cada commit — só commitar se os três passarem.
- Um commit por issue corrigida, mensagem referenciando o número da issue.
- Ao fechar uma issue no GitHub, usar
  `gh issue close <n> --repo acidevbutter/selolibertaria_backend --comment "..."`
  explicando o que foi feito.

## Log de execução

Ao terminar (ou parar), faça APPEND (nunca sobrescreva) de um bloco abaixo:

### Executado — <data>

- Chat: codex-cli
- Modelo: <modelo>
- Issues corrigidas: <lista>
- Issues fechadas no GitHub: <lista>
- Bloqueios/decisões: <texto>

### Executado — 2026-09-24 (Claude, retomando após Codex bater em rate limit)

- Chat: claude-code
- Modelo: Sonnet 5
- Issues corrigidas: #10 (ASAAS_ACCOUNT_ID nos templates .env.*.example)
- Issues já resolvidas por trabalho anterior, fechadas sem mudança de código: #29 (docker-entrypoint.sh já corrigido no commit 8931ac8, 2026-09-23)
- Issues fechadas no GitHub: #10, #29
- Commits: c88fcba (#10) na branch fix/prod-bugs-backend-2026-09-24
- Bloqueios/decisões: Codex (gpt-5.6-terra) fez o diff correto do #10 mas bateu em "Selected model is at capacity" antes de rodar testes/commitar; nunca chegou a tentar #29. Claude validou o diff (179 testes, ruff, mypy limpos) e commitou. Merge de volta no checkout principal do backend NÃO foi feito automaticamente: 2 dos 4 arquivos (.env.production.example, .env.staging.example) têm mudanças locais não commitadas do usuário (WIP de OpenTelemetry) que colidem — branch fica pronta para merge manual/confirmado.
