# 05 — Prompt de implementação: rotas de recebimento (relay, rotação, webhook de pagamento)

**Repositório alvo:** `selolibertaria/backend`
**Modelo recomendado:** implementação (raciocínio médio-alto — este arquivo cria toda a fronteira de confiança com o DevButter)
**Pré-requisito:** `01`, `02` aprovados. Deve rodar antes ou junto de `04` (cria a tabela `asaas_subaccount_credential` que `04` consome). Coordenar com `03` para os contratos de assinatura HMAC baterem dos dois lados.

## Escopo de leitura

- `selolibertaria/backend/app/webhooks/{router,models,repository}.py` (padrão de `WebhookEvent`/idempotência a reusar)
- `selolibertaria/backend/app/payments/service.py` (`MercadoPagoWebhookService.validate` — **copiar o padrão de `hmac.compare_digest`**, é o exemplo correto já existente no próprio repo)
- `02-system-design-payment-service.md` seções 3 e 4 (modelo de dados e contratos)
- `diagrams/fluxo-novo-provisionamento-e-rotacao.mmd` e `diagrams/fluxo-novo-pagamento-direto.mmd`

## Entregáveis

1. Migração Alembic: `asaas_subaccount_credential` e `asaas_relay_event` (schema em `02`).
2. `POST /integrations/devbutter/subaccounts` — recebe o relay inicial. Valida assinatura HMAC (header a alinhar com `03`) em tempo constante; idempotência por `event_id` em `asaas_relay_event`; grava/atualiza `asaas_subaccount_credential` (cifra a `api_key` antes de persistir, nunca loga o valor); responde `202` imediatamente e processa a gravação de forma que uma repetição do mesmo `event_id` seja no-op.
3. `POST /integrations/devbutter/subaccounts/{asaas_account_id}/key-updated` — mesmo padrão de validação/idempotência, atualiza a credencial existente (`key_version` incrementa, `status=active`), responde `200` só depois de confirmar a gravação (esse `200` É o ack que o `devbutter_backend` espera).
4. Helper/serviço que, ao detectar 401 vindo do `app/asaas/client.py` (do prompt `04`), marca a credencial `pending_rotation` e chama `POST /integrations/selolibertaria/subaccounts/{id}/rotate-key` no `devbutter_backend` (client HTTP de saída simétrico ao de `03`, mesma assinatura HMAC, direção invertida).
5. `POST /payments/asaas/webhook` — recebe eventos `PAYMENT_*` e `ACCOUNT_STATUS_*` da Asaas. Valida header `asaas-access-token` com `hmac.compare_digest`; idempotência por `id` do evento reusando `WebhookEvent`; tolera campos desconhecidos no payload (não falhar com `KeyError`/validação estrita demais); processa pelo menos `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED` atualizando `Payment`/`Order`; responde `200` rápido (processamento pesado assíncrono via `BackgroundTasks`).
6. Testes: relay duplicado (mesmo `event_id`) não duplica credencial; assinatura inválida é rejeitada (401/403); rotação aplicada corretamente incrementa `key_version`; webhook de pagamento com campo desconhecido no payload não quebra; webhook repetido (mesmo `id`) é no-op.

## Restrições explícitas

- Toda comparação de segredo/assinatura usa `hmac.compare_digest` — não `==`/`!=`. Este é o achado de segurança B4/D6 do levantamento técnico; não repetir o padrão frágil encontrado no `devbutter_backend`.
- Nunca logar `api_key` em claro nem incluí-la em mensagem de erro ou resposta HTTP.
- Não assumir nome/formato de header de assinatura sem confirmar com o prompt `03` (que roda no outro repositório) — se houver dúvida, registrar a decisão no log de execução deste arquivo e replicar no `03`.
- Nenhuma chamada de produção — sandbox Asaas, e o par DevButter↔Selolibertaria deve ser testado localmente/staging antes de qualquer chave real.

---

## Log de execução

_(anexar aqui após cada rodada de implementação, mesmo formato dos demais arquivos desta série.)_

## Executado — domínio `app/asaas/`, migração e testes (relay, rotação, webhook de pagamento)

- Data: 2026-08-28
- Chat: coding-agent (Cowork)
- Modelo: claude-sonnet-5
- Resultado:
  - Criado o domínio `app/asaas/` completo: `models.py` (`AsaasSubaccountCredential`,
    `AsaasRelayEvent`, enums `CredentialStatus`/`RelayEventType`), `schemas.py`,
    `signing.py` (implementação exata do CONTRATO-HMAC.md — HMAC-SHA256 hex,
    `f"{timestamp}.{nonce}.{raw_body}"`, janela de 5 min, `hmac.compare_digest`),
    `credential_store.py` (Fernet, `ASAAS_CREDENTIAL_ENCRYPTION_KEY`, nunca loga
    `api_key`), `repository.py` (dedupe de `AsaasRelayEvent`), `integrations_router.py`
    (`POST /integrations/devbutter/subaccounts` e
    `POST /integrations/devbutter/subaccounts/{id}/key-updated`), `devbutter_client.py`
    + `rotation_service.py` (helper de 401 → `pending_rotation` + chamada reativa
    `POST /integrations/selolibertaria/subaccounts/{id}/rotate-key`), `webhook_router.py`
    + `webhook_service.py` + `webhook_jobs.py` (`POST /payments/asaas/webhook`,
    `PAYMENT_*`/`ACCOUNT_STATUS_*`, processamento assíncrono via `BackgroundTasks`).
  - `app/payments/models.py`: stub de uma linha substituído pela tabela `payment`
    (schema da seção 3 do `02`, provider `mercado_pago|asaas`).
  - Migração Alembic nova:
    `alembic/versions/20260828_2145_d0580cff5258_add_asaas_relay_and_payment.py`
    (revisa `924f7cf48285`, head único confirmado antes de escrever) — cria
    `asaas_subaccount_credential`, `asaas_relay_event` e `payment`. Comando:
    `poetry run alembic upgrade head` (dev/staging, sandbox Asaas apenas).
  - `alembic/env.py`: registrados `app.asaas.models` e `app.payments.models` (este
    último passou a ter tabela real) na lista de imports que alimenta
    `Base.metadata`, para autogenerate futuro não perder essas tabelas.
  - `app/settings/config.py` e `.env.example`: novas variáveis
    `ASAAS_WEBHOOK_ACCESS_TOKEN`, `ASAAS_CREDENTIAL_ENCRYPTION_KEY`,
    `DEVBUTTER_SELOLIBERTARIA_RELAY_HMAC_SECRET`, `DEVBUTTER_BACKEND_BASE_URL`.
  - `app/main.py`: registrados `asaas_integrations_router` e `asaas_webhook_router`.
  - `pyproject.toml`: adicionada dependência `cryptography = "^43.0.0"` (Fernet).
    **`poetry.lock` NÃO foi regenerado** (ver Bloqueios) — rodar `poetry lock` antes
    de `poetry install` em qualquer ambiente com acesso à rede.
  - Testes novos: `tests/test_asaas_integrations.py` (assinatura inválida → 401
    `{"detail":"invalid_signature"}`; timestamp fora da janela de 5 min → 401; relay
    duplicado por `event_id` não duplica `AsaasSubaccountCredential`; rotação via
    `key-updated` incrementa `key_version` e troca a chave decifrável; `key-updated`
    para conta nunca relayada → 404; `AsaasRotationService.handle_unauthorized` marca
    `pending_rotation` e aciona o client de saída) e `tests/test_asaas_webhook.py`
    (token ausente/errado → 401; payload com campos desconhecidos não quebra e
    atualiza `Payment`; evento repetido pelo `id` é no-op — conta idempotência e não
    duplica `Payment`; `PAYMENT_RECEIVED` com `externalReference` casando um `Order`
    atualiza `Order.status`; evento `ACCOUNT_STATUS_*` é aceito e marcado processado).
- Decisão/Bloqueios:
  - **Bloqueio ambiental (não fica resolvido por retry) — testes não executados de
    fato.** O `device_bash` deste Cowork roda numa VM Linux isolada, distinta da
    máquina real do usuário: o `.venv` do repo foi criado por um `pyenv` macOS
    (`darwin arm64`, binários Mach-O) e é inutilizável aqui; o Python 3.10 do
    sistema desta VM não tem `fastapi`/`sqlalchemy`/`pytest`/etc. instalados; e não
    há acesso de rede (proxy HTTP/SOCKS configurado bloqueia com 403) para `pip
    install` ou `poetry install`/`poetry lock`. Docker também não está disponível
    nesta VM. Ou seja: não existe, dentro deste `device_bash`, nenhum interpretador
    Python compatível com as dependências do projeto e com acesso para instalá-las.
    **Isto precisa rodar de verdade — `poetry lock && poetry install && poetry run
    pytest tests/test_asaas_integrations.py tests/test_asaas_webhook.py` — na
    máquina real do usuário (ou em CI) antes de considerar esta fatia mergeável.**
  - Mitigação aplicada nesta sessão, dado o bloqueio acima: (1) todo arquivo novo
    passou por `ast.parse` (sintaxe válida) e por um checker manual de imports não
    usados; (2) a lógica de `app/asaas/signing.py` (HMAC, janela de 5 min, rejeição
    de assinatura inválida/segredo ausente) foi executada de fato neste ambiente via
    stubs leves de `app.core.exceptions`/`app.settings.config` (sem FastAPI/SQLAlchemy)
    — os 4 cenários (assinatura válida, inválida, timestamp velho, segredo ausente)
    passaram; (3) o round-trip Fernet (`cryptography`, disponível globalmente nesta
    VM fora do venv do projeto) foi validado isoladamente; (4) todo o resto (rotas
    FastAPI, SQLAlchemy, testes de integração) foi revisado por leitura cuidadosa
    contra os padrões já estabelecidos no repo (`app/webhooks/`, `app/payments/`,
    `app/checkout/jobs.py`, `tests/conftest.py`, `tests/test_checkout_reconciliation_lock.py`
    para o padrão de sessão cross-`session_factory` que o job em background usa) —
    mas **isto não substitui rodar a suíte de verdade**.
  - Idempotência de relay/rotação desenhada para reprocessar (não só "duplicate=true")
    quando o `AsaasRelayEvent` existe mas `processed_ok=False` (uma tentativa anterior
    falhou no meio) — decisão além do texto literal do prompt, motivada pelo próprio
    risco que o ADR-0001 aponta ("webhook falha silenciosamente, checkout quebra").
    O webhook de pagamento Asaas segue a mesma lógica via `WebhookEvent.status`.
  - `apply_rotation` usa o `key_version` que o `devbutter_backend` envia no payload
    como fonte da verdade (não incrementa localmente); uma entrega com
    `key_version <= key_version atual` é tratada como no-op (entrega atrasada/fora de
    ordem), não como downgrade.
  - Tabela `payment` (seção 3 do `02`) foi criada nesta fatia, embora o entregável 1
    só cite explicitamente `asaas_subaccount_credential`/`asaas_relay_event` — sem
    ela o entregável 5 (atualizar `Payment`) não tinha onde escrever. `order_id` é
    nullable e o match com `Order` é best-effort via `externalReference` da Asaas
    == `Order.id` (convenção assumida, não confirmada com `04`/checkout Asaas real,
    que ainda não existe).
  - `app/asaas/client.py` (prompt `04`) **não foi criado** — apenas
    `credential_store.py`, que `04` deve reusar somente para leitura
    (`get_active_key`), e `rotation_service.py`/`devbutter_client.py`, que o futuro
    `client.py` deve chamar em caso de 401.
  - Nome de header confirmado com `CONTRATO-HMAC.md` (`X-DevButter-Signature/
    Timestamp/Nonce` e `X-Selolibertaria-Signature/Timestamp/Nonce`) — nenhum desvio
    do contrato, nenhuma decisão nova a replicar em `03`.

## Executado — gate de verificação na máquina real (testes rodados de fato)

- Data: 2026-08-28
- Chat: Claude Code (terminal, máquina do usuário)
- Modelo: claude-sonnet-5
- Resultado:
  - `poetry lock` regenerado (o `poetry.lock` versionado não tinha `cryptography`,
    dependência adicionada pela fatia anterior) e `poetry install --with dev` — 3
    pacotes novos (`cryptography 43.0.3`, `cffi`, `pycparser`).
  - Suíte completa executada de verdade pela primeira vez: `poetry run python -m
    pytest -q` → **70 passed**. Rodadas isoladas `tests/test_asaas_integrations.py`
    e `tests/test_asaas_webhook.py` → 13 passed.
  - Bug corrigido: `tests/test_asaas_webhook.py::
    test_webhook_updates_matching_order_on_confirmed_payment` falhava
    (`assert 'processing' == 'succeeded'`). Causa era **do teste**, não do código —
    o job em background comita o `Order` via sessão própria, mas o teste re-consultava
    pela sessão do request (identity map com `expire_on_commit=False` mantinha a cópia
    `processing` em cache). Reproduzido fora do pytest: a linha do banco vira mesmo
    `succeeded`. Fix: `db_session.expire_all()` antes da re-consulta. Código de
    `webhook_service.py` (`_ORDER_STATUS_BY_EVENT`) está correto.
  - Lint: `ruff check app/ tests/` estava com 16 achados novos (15 `E501`, 1 `I001`)
    só nos arquivos da fatia — todos corrigidos (quebra de linha manual;
    `_parse_body` ganhou `TypeVar` ligado a `BaseModel`). `ruff check` agora limpo.
  - Tipos: `mypy app/asaas/` tinha 4 erros novos (união `None`/`dict` sem narrowing
    em `webhook_service.process_account_status_event`, `type: ignore` órfão em
    `client.py`, `_parse_body` sem anotação de retorno / `type` genérico em
    `integrations_router.py`) — todos corrigidos. `mypy app/asaas/` limpo.
    (O repo como um todo não é mypy-strict-clean — 74 erros pré-existentes em
    `oauth`/`mongo`/`migrations` —, mas os domínios vizinhos `payments`/`webhooks`/
    `checkout` são, e `asaas` agora também.)
  - Migração `d0580cff5258` verificada: `alembic heads` = head único;
    `alembic history` liga `924f7cf48285 -> d0580cff5258`; `upgrade head` e
    `downgrade -1` rodam limpos contra SQLite descartável.
- Decisão/Bloqueios:
  - Nenhum bloqueador nesta rodada. Fatia `05` está verde na máquina real.
  - `poetry.lock` mudou — precisa ser commitado junto.
  - Ainda pendente para "GO" de `06`: o bloqueador `07` (nenhum caminho real
    entrega a `apiKey` da subconta) permanece; `04` (router/service de checkout
    Asaas) ainda não foi implementado — `client.py` existe só em modo mock.
