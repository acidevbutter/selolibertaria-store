# RUN — executar a série de prompts com Codex CLI

> **Não executar:** esta série foi supersedida em 2026-09-07 pelo plano
> [`../asaas-payment-proxy-internal/README.md`](../asaas-payment-proxy-internal/README.md),
> que mantém a `apiKey` exclusivamente no `asaas_payment`.

Runner para a série `asaas-payment-integration/` usando `codex exec` (não‑interativo).
Cada prompt numerado é rodado **dentro do repo alvo**, com a pasta desta série montada
como diretório adicional para que o Codex leia os docs de contexto (`00`, `02`,
`CONTRATO-HMAC.md`, `diagrams/*.mmd`) e **anexe** o log de execução no fim do arquivo.

> Direção vigente: **ADR‑0003 (Accepted, 2026‑09‑04)** — relay de credencial direto por HMAC.
> Isso mantém o caminho `03 → 04/05 → 07 → 08 → 06 → 09` e **estaciona** os prompts `10` e
> `11` (migração para o proxy mTLS `asaas_payment`), que a ADR‑0003 rejeita. Não rodar `10`/`11`
> sem uma nova ADR revertendo a 0003.

## 0. Variáveis (cole no shell)

```bash
export PROMPTS="/Users/marcospereira/development/selolibertaria/docs/prompts/asaas-payment-integration"
export SELO="/Users/marcospereira/development/selolibertaria/backend"
export DBB="/Users/marcospereira/development/devbutter_app/devbutter_backend"
export ASAAS="/Users/marcospereira/development/devbutter_app/asaas_payment"

# Ajuste ao seu setup de Codex se necessário:
export CDX_MODEL="gpt-5-codex"
```

## 1. Template de execução

```bash
run_prompt() {
  # $1 = repo alvo (cwd)   $2 = arquivo do prompt   $3 = reasoning effort (low|medium|high)
  codex exec \
    -C "$1" \
    --add-dir "$PROMPTS" \
    --skip-git-repo-check \
    -s workspace-write \
    -m "$CDX_MODEL" -c model_reasoning_effort="$3" \
    -o "$PROMPTS/.codex-last-$(basename "$2" .md).txt" \
    "Execute a fatia descrita no bloco <stdin>. Respeite o escopo de leitura e as \
proibições explícitas do arquivo — não leia o repo inteiro, não chame API de produção \
da Asaas, não rotacione chave real. Ao terminar, faça APPEND (nunca sobrescreva) de um \
bloco '## Executado — $(date +%F)' no fim de $(basename "$2"), com: Data, Chat (codex-cli), \
Modelo, Resultado, Decisão/Bloqueios." \
    < "$2"
}
```

Notas:
- `-s workspace-write`: o Codex pode editar o repo alvo e anexar o log; sem acesso de rede a
  serviços externos. Use `-s read-only` para os passos de revisão pura (`06`).
- `--add-dir "$PROMPTS"` torna a pasta da série gravável (para o log) e legível (contexto).
- `-o …` grava a última mensagem do agente num arquivo, útil para colar o veredito no PR.
- Rode um prompt por vez e **revise o diff** antes do próximo — a ordem tem dependências.

## 2. Ordem de execução

Planejamento (`01` ADR, `02` system design) já revisado — a ADR‑0003 consolida a decisão.
Estado registrado no `README.md`: `03`, `04`, `05`, `07` implementados. Pendentes abaixo.

| Passo | Comando | Repo | Effort | Pré‑requisito |
|---|---|---|---|---|
| **08** | `run_prompt "$DBB" "$PROMPTS/08-prompt-devbutter-consumir-relay-credential.md" high` | `devbutter_backend` | high | `07` verde no `asaas_payment` |
| **06** | `run_prompt "$SELO" "$PROMPTS/06-prompt-validacao-seguranca-e2e.md" high` (troque `-s workspace-write` por `-s read-only` no template) | revisão cruza `devbutter_backend` + `selolibertaria/backend` | high | `03`,`04`,`05`,`08` verdes |
| **09** | `run_prompt "$SELO" "$PROMPTS/09-prompt-piloto-sandbox-e-cutover.md" medium` — adicione `--add-dir "$DBB" --add-dir "$ASAAS"` ao comando | config nos 3 repos | medium | `06` sem NO‑GO pendente |

### Já executados (rerun só se for refazer a fatia)

```bash
run_prompt "$DBB"   "$PROMPTS/03-prompt-devbutter-relay-e-rotacao.md"                 high
run_prompt "$SELO"  "$PROMPTS/04-prompt-selolibertaria-asaas-client-checkout.md"      high
run_prompt "$SELO"  "$PROMPTS/05-prompt-selolibertaria-webhook-recebimento.md"        high
run_prompt "$ASAAS" "$PROMPTS/07-bloqueador-apikey-nao-e-relayavel.md"                high
```

### Estacionados pela ADR‑0003 (não rodar)

```bash
# 10-prompt-selolibertaria-asaas-proxy-client.md   — caminho proxy mTLS, rejeitado
# 11-prompt-selolibertaria-consumir-nota-fiscal.md  — depende do 10
```

## 3. Rodar a fila pendente de uma vez

```bash
set -e
run_prompt "$DBB" "$PROMPTS/08-prompt-devbutter-consumir-relay-credential.md" high
# revise o diff em $DBB, rode os testes, commit — só então:
codex exec -C "$SELO" --add-dir "$PROMPTS" --add-dir "$DBB" --skip-git-repo-check \
  -s read-only -m "$CDX_MODEL" -c model_reasoning_effort=high \
  -o "$PROMPTS/.codex-last-06.txt" \
  "Revisão de segurança do bloco <stdin>. Veredito explícito GO/NO-GO por item do \
checklist, conservador. NO-GO é resultado válido. Append do bloco '## Executado — $(date +%F)' \
no fim de 06-prompt-validacao-seguranca-e2e.md." \
  < "$PROMPTS/06-prompt-validacao-seguranca-e2e.md"
# resolvido eventual NO-GO:
run_prompt "$SELO" "$PROMPTS/09-prompt-piloto-sandbox-e-cutover.md" medium
```

## 4. Interativo (alternativa)

Para acompanhar passo a passo em vez de `exec`:

```bash
cd "$DBB"
codex --add-dir "$PROMPTS" -m "$CDX_MODEL" -c model_reasoning_effort=high
# no prompt do Codex:  seguir o arquivo $PROMPTS/08-prompt-devbutter-consumir-relay-credential.md
```
