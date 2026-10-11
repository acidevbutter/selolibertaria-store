# RUN — executar as duas tracks em paralelo com Codex CLI

## 0. Criar os worktrees (uma vez, antes de rodar)

```bash
cd /Users/marcospereira/development/selolibertaria
git -C backend worktree add ../.worktrees/prod-fixes-backend -b fix/prod-bugs-backend-2026-09-24
git -C selolibertaria-store worktree add ../.worktrees/prod-fixes-store -b fix/prod-bugs-store-2026-09-24 staging
```

## 1. Variáveis

```bash
export PROMPTS="/Users/marcospereira/development/selolibertaria/docs/prompts/prod-fixes-2026-09-24"
export BACKEND_WT="/Users/marcospereira/development/selolibertaria/.worktrees/prod-fixes-backend"
export STORE_WT="/Users/marcospereira/development/selolibertaria/.worktrees/prod-fixes-store"
export CDX_MODEL="gpt-5-codex"
```

## 2. Rodar as duas tracks em paralelo

```bash
codex exec \
  -C "$BACKEND_WT" \
  --add-dir "$PROMPTS" \
  --skip-git-repo-check \
  -s workspace-write \
  -m "$CDX_MODEL" -c model_reasoning_effort="high" \
  -o "$PROMPTS/.codex-last-00.txt" \
  "Execute a track descrita no bloco <stdin>, issue por issue, um commit por issue. \
Respeite a seção Restrições à risca — não pule nem improvise fora do escopo listado. \
Rode os testes/lint/typecheck indicados antes de cada commit; só commite se passarem. \
Ao terminar (ou se travar em algo), faça APPEND (nunca sobrescreva) do bloco 'Log de \
execução' no fim de 00-backend-track.md." \
  < "$PROMPTS/00-backend-track.md" &

codex exec \
  -C "$STORE_WT" \
  --add-dir "$PROMPTS" \
  --skip-git-repo-check \
  -s workspace-write \
  -m "$CDX_MODEL" -c model_reasoning_effort="high" \
  -o "$PROMPTS/.codex-last-01.txt" \
  "Execute a track descrita no bloco <stdin>, issue por issue, um commit por issue. \
Respeite a seção Restrições à risca — não pule nem improvise fora do escopo listado. \
Rode os testes/lint/typecheck indicados antes de cada commit; só commite se passarem. \
Ao terminar (ou se travar em algo), faça APPEND (nunca sobrescreva) do bloco 'Log de \
execução' no fim de 01-store-track.md." \
  < "$PROMPTS/01-store-track.md" &

wait
echo "Ambas as tracks terminaram. Revise o diff em cada worktree antes de merge."
```

## 3. Depois que terminar

```bash
git -C "$BACKEND_WT" log --oneline staging..HEAD
git -C "$STORE_WT" log --oneline staging..HEAD
# revise cada diff, rode a suíte completa de novo, só então merge/PR
```
