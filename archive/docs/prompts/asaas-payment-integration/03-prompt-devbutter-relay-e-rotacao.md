# 03 — Prompt de implementação: relay de credencial + rotação (devbutter_backend)

**Repositório alvo:** `devbutter_app/devbutter_backend`
**Modelo recomendado:** implementação (Claude/Codex, raciocínio médio-alto — toca segurança de credencial)
**Pré-requisito:** ADR-0001 (`01-adr-integracao-asaas.md`) e `02-system-design-payment-service.md` revisados e aprovados. Não implementar antes disso.

## Escopo de leitura (leia somente isto, não o repo inteiro)

- `devbutter_app/devbutter_backend/app/core/clients/asaas_client.py`
- `devbutter_app/devbutter_backend/app/accounts/models.py` (`AsaasSubaccountLink`)
- `devbutter_app/devbutter_backend/app/admin/payments_router.py` e `payments_service.py`
- `devbutter_app/devbutter_backend/app/webhooks/{router,models}.py` (padrão de webhook existente — vai ser reusado/consertado)
- `docs/plano-admin-asaas-integracao.md`, `docs/diagrams/asaas-integration-sequence.mmd`
- Este ADR e os três `.mmd` em `selolibertaria/docs/prompts/asaas-payment-integration/diagrams/`

## Entregáveis

1. **Cliente de saída** (`app/integrations/selolibertaria_client.py` ou similar): chama `POST /integrations/devbutter/subaccounts` e `POST /integrations/devbutter/subaccounts/{id}/key-updated` no backend do Selolibertaria. Corpo conforme contratos definidos em `02` (`event_id`, `asaas_account_id`, `wallet_id`, `access_token_ref`, `api_key`, `issued_at`/`key_version`/`reason`). Assinatura HMAC-SHA256 com timestamp+nonce no header (definir nome do header, ex. `X-DevButter-Signature`, `X-DevButter-Timestamp`); retry com backoff exponencial (3 tentativas) e log estruturado sem nunca logar `api_key` em claro.
2. **Disparo do relay inicial**: após o fluxo já existente de criação de subconta + access token (ver `asaas_client.py`), acionar o cliente de saída acima. Persistir o resultado (`sent`, `acked`, `failed`) em `AsaasSubaccountLink` (novo campo `selolibertaria_relay_status`) ou tabela própria — decidir e documentar no log de execução deste arquivo.
3. **Job de rotação proativa**: verifica `AccessToken.expiration_date` (campo já existe) e eventos `ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRING_SOON`/`EXPIRED` recebidos via `app/webhooks/router.py`; quando aplicável, rotaciona via `asaas_client` (mesmo caminho do proxy `asaas_payment`) e chama o cliente de saída com `reason:"proactive"`.
4. **Endpoint reativo de entrada**: `POST /integrations/selolibertaria/subaccounts/{asaas_account_id}/rotate-key`, autenticado (mesmo esquema HMAC, chave compartilhada dedicada — não reusar `TRUSTED_PROXY_SECRET` nem `AUDIT_SIGNING_KEY` do `asaas_payment`), que dispara a mesma rotação do item 3 com `reason:"reactive"`.
5. **Correção de segurança correlata**: trocar a comparação `!=` do header `asaas-access-token` em `app/webhooks/router.py` por `hmac.compare_digest` (constant-time) — mesmo padrão já usado no webhook Mercado Pago do Selolibertaria.
6. Testes: happy path do relay inicial, rotação proativa disparada por `expiration_date` próxima, rotação reativa disparada pelo endpoint, falha de entrega (Selolibertaria fora do ar) marcando `pending`/retry, e o teste de regressão da correção de `hmac.compare_digest`.

## Restrições explícitas

- Nenhuma chamada à API de produção da Asaas. Usar sandbox (`ASAAS_BASE_URL` já aponta pra sandbox por padrão no `asaas_payment`).
- Não inventar comportamento da Asaas não confirmado na pesquisa (`00-levantamento-tecnico.md`) — em particular, a rotação de token de subconta pela conta raiz **depende de uma janela manual de 2h habilitada na interface Asaas** (item D.1); o job proativo deve assumir que essa chamada pode falhar com 403/janela fechada e tratar isso como um estado observável (alerta), não como bug do código.
- Não expor `api_key` em nenhum log, métrica ou resposta HTTP de erro.
- Salvar um resumo da execução em `runs/03-devbutter-relay-e-rotacao-implementation.md` (mesma convenção de `devbutter_app/docs/prompts/payment-tokenization/runs/`) se este diretório `runs/` for criado; caso contrário, anexar o log abaixo mesmo.

---

## Log de execução

_(anexar aqui, no formato `## Executado — <resumo>` com Data, Chat, Modelo, Resultado, Decisão/Bloqueios, após cada rodada de implementação. Não editar esta seção antes de rodar a fatia.)_

## Executado — cliente de relay HMAC, disparo inicial, rotação proativa/reativa, fix hmac.compare_digest, testes
- Data: 2026-08-28
- Chat: coding-agent (Cowork)
- Modelo: claude-sonnet-5
- Resultado:
  - Criados em `devbutter_app/devbutter_backend/app/integrations/`: `hmac_signing.py` (implementa CONTRATO-HMAC.md — HMAC-SHA256 hex sobre `timestamp.nonce.raw_body`, janela de 5min, `hmac.compare_digest`), `selolibertaria_client.py` (`SelolibertariaClient`, retry exponencial de 3 tentativas, nunca loga corpo/`api_key`), `relay_service.py` (`SelolibertariaRelayService` — bookkeeping de `AsaasSubaccountLink.selolibertaria_relay_*`), `rotation_service.py` (`CredentialRotationService` — sweep proativo por `expirationDate`, roteamento de `ACCOUNT_STATUS_COMMERCIAL_INFO_{EXPIRING_SOON,EXPIRED}`, rotação reativa), `router.py` (`POST /integrations/selolibertaria/subaccounts/{id}/rotate-key`, autenticado por HMAC dedicado, idempotente por `event_id`).
  - Editados: `app/accounts/models.py` (novos campos em `AsaasSubaccountLink`: `access_token_id`, `key_version`, `selolibertaria_relay_status`, `selolibertaria_relay_attempted_at`, `selolibertaria_relay_last_error`), `app/accounts/repository.py` (`AsaasSubaccountLinkRepository.list_with_access_token`), `app/webhooks/models.py` (campo `event_id` opcional/único em `WebhookEvent`, reusado para dedupe do rotate-key reativo), `app/webhooks/repository.py` (`get_by_event_id`, `create(event_id=...)`), `app/webhooks/schemas.py` (`AsaasWebhookEvent.payment`/`.account` agora opcionais, `extra="allow"`), `app/webhooks/service.py` (roteamento `PAYMENT_*` vs `ACCOUNT_STATUS_*`, `hmac.compare_digest` correlato em `router.py`), `app/admin/companies_service.py` (`link_subaccount` dispara o relay inicial ao provisionar subconta nova), `app/admin/companies_router.py`, `app/admin/schemas.py` (campos de relay expostos em `AdminSubaccountLinkRead`), `app/settings/config.py` + `.env.example` (`SELOLIBERTARIA_BACKEND_BASE_URL`, `DEVBUTTER_SELOLIBERTARIA_RELAY_HMAC_SECRET`, `SELOLIBERTARIA_RELAY_REQUEST_TIMEOUT_SECONDS`), `app/main.py` (router + `close_selolibertaria_client` no lifespan).
  - Migração: `alembic/versions/20260828_1000_add_selolibertaria_relay_fields.py` (`down_revision='80849bed4242'`, cabeça real da cadeia — o nome de arquivo `20260827_0347_...` não é o revision id). Comando: `poetry run alembic upgrade head`.
  - Job de rotação proativa: `scripts/run_proactive_rotation.py` — sem scheduler em processo (não há APScheduler no projeto); pensado para cron/CronJob externo, exit code 1 quando algum link fica `blocked`/`rotation_blocked`.
  - Testes novos: `tests/test_hmac_signing.py`, `tests/test_selolibertaria_relay.py` (relay inicial happy-path e blocked, rotação proativa por expiração, rotação bloqueada por 403/janela fechada, evento ACCOUNT_STATUS, disparo via `AdminCompaniesService.link_subaccount`), `tests/test_integrations_router.py` (endpoint reativo: happy path, assinatura inválida, subconta desconhecida, idempotência por `event_id`), `tests/test_webhooks_asaas.py` (regressão do `hmac.compare_digest` + webhook `ACCOUNT_STATUS_*` disparando rotação).
- Decisão/Bloqueios:
  - **Bloqueio real descoberto (não resolvido nesta fatia, fora de escopo)**: `asaas_payment` (repo irmão, NÃO editado aqui) redige `apiKey` de *toda* resposta em `/subaccounts...` — inclusive `POST /subaccounts/{id}/access-tokens` (`hide_api_key=True` em `asaas_payment/app/subaccounts/router.py`). Ou seja, `devbutter_backend` hoje **não tem como obter o valor da credencial** para repassar ao Selolibertaria, mesmo seguindo exatamente o fluxo do diagrama `fluxo-novo-provisionamento-e-rotacao.mmd`. Implementei o relay/rotação assumindo que isso será corrigido (uma rota dedicada em `asaas_payment`, CN-gated, que revele `apiKey` só para `devbutter_backend`) — enquanto isso, todo caminho que não recebe `apiKey` marca o link como `blocked`/`rotation_blocked` com um erro descritivo, em vez de enviar um relay vazio ou falhar silenciosamente. Sugiro uma fatia própria em `asaas_payment` para essa rota antes de qualquer piloto real.
  - Nome dos novos campos/tabela: optei por estender `AsaasSubaccountLink` (não criar tabela própria) com `selolibertaria_relay_status` (`pending|sent|acked|failed|blocked|rotation_blocked`), `key_version`, `access_token_id`; e reusar `WebhookEvent` (campo novo `event_id`, opcional/único) para idempotência do rotate-key reativo, em vez de criar uma tabela `asaas_relay_event` dedicada — mantém uma única fonte de estado por subconta e reaproveita dedupe já testado.
  - Secret dedicado `DEVBUTTER_SELOLIBERTARIA_RELAY_HMAC_SECRET`, não reaproveita `TRUSTED_PROXY_SECRET`/`AUDIT_SIGNING_KEY`/`FIELD_ENCRYPTION_KEY`, conforme CONTRATO-HMAC.md.
  - Sem scheduler em processo para a rotação proativa (projeto não tem APScheduler) — decidido como script externo (`scripts/run_proactive_rotation.py`), a agendar via cron/CronJob por infra.
  - **Bloqueio de ambiente para verificação**: não há acesso de rede a PyPI nem no `device_bash` (proxy 403) nem no container cloud (`host_not_allowed` — política de egress do projeto). Não foi possível `poetry install`/`pytest` de fato. Verificação feita via `python -m py_compile` em todos os arquivos novos/alterados (sintaticamente válidos) e revisão manual linha-a-linha de cada assinatura/chamada cruzada contra o código real lido. Um bug real já foi pego dessa forma (down_revision errado na migração — corrigido). Os testes escritos não foram executados de fato; podem conter erros que só um `pytest` real revelaria. Recomendo rodar `poetry install && poetry run pytest tests/test_hmac_signing.py tests/test_selolibertaria_relay.py tests/test_integrations_router.py tests/test_webhooks_asaas.py tests/test_admin_payments.py tests/test_admin_approval_flow.py` localmente antes de mergear.

## Executado — gate de verificação na máquina real (testes rodados de fato)

- Data: 2026-08-29
- Chat: Claude Code (terminal, máquina do usuário)
- Modelo: claude-sonnet-5
- Contexto: o `devbutter_backend` agora está disponível localmente. O código da rodada
  anterior (`app/integrations/`, migração `20260828_1000`, edições em
  `app/webhooks/`, `app/accounts/`, `app/admin/`, `scripts/run_proactive_rotation.py`
  e os 4 arquivos de teste) estava no working tree, não commitado, na branch `master`
  — e nunca tinha sido executado.
- Resultado:
  - `poetry.lock` já batia com o `pyproject.toml` (a fatia não adicionou dependência);
    `.venv` do repo válido. Sem `poetry lock` necessário aqui (diferente do
    `selolibertaria/backend`).
  - Suíte completa executada de verdade pela primeira vez: `poetry run python -m
    pytest -q` → **155 passed, 1 skipped**. Os 4 arquivos de teste da fatia:
    `test_hmac_signing.py` + `test_selolibertaria_relay.py` +
    `test_integrations_router.py` + `test_webhooks_asaas.py` → 31 passed.
    **Nenhum bug de teste** (ao contrário do gate de `05` no outro repo).
  - Migração `20260828_1000`: `alembic heads` = head único;
    `alembic history` liga `80849bed4242 -> 20260828_1000`. Aplicada contra
    **Postgres real** pelo teste `test_payment_security_contexts_postgres.py`
    (`command.upgrade(..., "head")` num container descartável) → 2 passed. Corrigido
    o docstring `Revises:` da migração, que ainda citava o nome de arquivo
    (`20260827_0347`) em vez do revision id real (`80849bed4242`).
  - Lint: `ruff check` tinha 10 achados novos só nos arquivos da fatia
    (`E501`, `I001`, `F841` `link` não usado em `test_selolibertaria_relay.py`,
    `UP012` `.encode("utf-8")` em `hmac_signing.py`, mais 2 em
    `app/webhooks/service.py` confirmados como regressão via `git stash`) — todos
    corrigidos. `ruff check` limpo nos arquivos da fatia (resta 1 achado
    pré-existente não relacionado em `app/conversations/router.py`).
  - Tipos: `mypy` neste repo é ruidoso de base (62+ erros pré-existentes em
    `webhooks`/`core.clients`), **não é gate**. A fatia introduziu 3 `union-attr`
    em `app/webhooks/service.py` (`event.payment` virou `... | None`) — corrigido
    com um guard `if event.payment is None: return` no topo de `handle_payment_event`
    (o call-site já era guardado; o guard também satisfaz o mypy). Os 2
    `untyped-decorator` em `app/integrations/selolibertaria_client.py` são o mesmo
    padrão do `app/core/clients/asaas_client.py` já existente — consistente com o
    repo, não mexido.
- Decisão/Bloqueios:
  - Nenhum bloqueador de código nesta rodada. Fatia `03` está verde na máquina real.
  - Continua não commitado (branch `master`) — precisa de branch própria antes do commit.
  - O bloqueador de negócio **`07`** (o `asaas_payment` nunca devolve a `apiKey` da
    subconta, então todo caminho de relay marca o link como `blocked`/
    `rotation_blocked`) **permanece** — `03` está correto e testado, mas o caminho
    ponta-a-ponta com subconta real só funciona depois de `07` ser decidido e
    implementado no `asaas_payment`.
