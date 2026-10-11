# 04 — Prompt de implementação: cliente Asaas direto + checkout (selolibertaria/backend)

**Repositório alvo:** `selolibertaria/backend`
**Modelo recomendado:** implementação (raciocínio médio-alto)
**Pré-requisito:** `01`, `02` aprovados. Pode rodar em paralelo com `03` desde que `05` (rotas de recebimento) rode antes ou junto, já que este arquivo depende da tabela `asaas_subaccount_credential` existir.

## Escopo de leitura

- `selolibertaria/backend/app/payments/{router,service,mercado_pago_client,models,schemas,repository}.py` (padrão de domínio a replicar)
- `selolibertaria/backend/app/webhooks/{router,models}.py`
- `selolibertaria/backend/app/orders/` (para saber como associar `Payment` a `Order`)
- `02-system-design-payment-service.md` (contratos e modelo de dados desta série)
- `devbutter_app/asaas_payment/app/ecommerce/router.py` (referência de quais chamadas a Asaas o domínio de e-commerce faz — **só como referência de shape de request/response**, não copiar o proxy mTLS)

## Entregáveis

1. Novo domínio `app/asaas/` seguindo o padrão `{router,service,client,repository,models,schemas}.py` já usado em `app/payments/`.
2. `app/asaas/client.py`: `httpx.AsyncClient` direto a `https://api.asaas.com/v3` (sandbox: URL de sandbox), autenticação por header `access_token` com a chave lida via `credential_store` (item 3), timeout curto configurável (`ASAAS_REQUEST_TIMEOUT_SECONDS`, mesmo nome de env var já usado no `devbutter_backend` para consistência), retry só em 5xx/429, **sem retry em 401** — 401 deve propagar para acionar o fluxo de rotação reativa (ver `05`).
3. `app/asaas/credential_store.py`: leitura/escrita cifrada da tabela `asaas_subaccount_credential` (Fernet, mesma convenção do `asaas_payment`; gerar/gerir `ASAAS_CREDENTIAL_ENCRYPTION_KEY` própria do Selolibertaria — não reusar `FIELD_ENCRYPTION_KEY` do `asaas_payment`, são segredos de sistemas diferentes).
4. `app/asaas/payments_router.py`: `POST /payments/asaas/customers`, `POST /payments/asaas/charges` (aceitar `billing_type` PIX/BOLETO/CREDIT_CARD), `GET /payments/asaas/charges/{id}`.
5. Tabela/model `Payment` real (substituindo o stub de uma linha em `app/payments/models.py`) conforme schema em `02` seção 3, com `provider` diferenciando `mercado_pago`/`asaas` — sem remover o código Mercado Pago existente.
6. Migração Alembic para `payment` e `asaas_subaccount_credential` (esta última pode já ter sido criada pelo prompt `05` — coordenar para não duplicar migração).
7. Testes: criação de cliente/cobrança Pix e boleto em sandbox, tratamento de 401 propagado, idempotência de criação de cliente (não duplicar customer na Asaas para o mesmo comprador).

## Restrições explícitas

- Não recriar o proxy mTLS `asaas_payment` — a chamada é HTTP direta com `httpx`, autenticada só pela `api_key` da subconta.
- Não remover nem desativar `app/payments/mercado_pago_client.py` — Asaas e Mercado Pago coexistem até decisão explícita de produto (ADR-0001, action item 4).
- Não usar chave de produção da Asaas em teste automatizado — usar sandbox ou mocks de `httpx`.
- Nenhuma tokenização de cartão neste prompt — se cartão for necessário, tratar como extensão futura alinhada com (e não duplicando) a iniciativa `docs/prompts/payment-tokenization/` do `devbutter_app`, hoje em NO-GO.

---

## Log de execução

_(anexar aqui após cada rodada de implementação, mesmo formato dos demais arquivos desta série.)_

## Executado — checkout service + router + testes (fecha o que faltava de `04`)

- Data: 2026-08-28
- Chat: Claude Code (terminal, máquina do usuário)
- Modelo: claude-sonnet-5
- Contexto: `app/asaas/client.py` (mock/live), `credential_store.py`, model `Payment`,
  schemas de checkout e a migração `d0580cff5258` já existiam de uma rodada anterior
  (dropada junto com `05`). Esta rodada implementou o que faltava do `04`.
- Resultado:
  - Novo `app/asaas/checkout_service.py` (`AsaasCheckoutService`): orquestra
    `create_customer`/`create_charge`/`get_charge` sobre `AsaasClient`; reconcilia
    toda cobrança criada na tabela local `payment` (`provider=asaas`,
    `provider_payment_id`, `status`, `billing_type`, `amount`, `raw_last_event`,
    `order_id` via `external_reference == Order.id` best-effort — mesma convenção
    que `app/asaas/webhook_service.py` já usa); `get_charge` lê o `payment` local
    primeiro (visão mantida pelo webhook) e só cai no provedor se não houver linha.
    Fluxo de 401: `_guarded()` captura `AsaasUnauthorizedError` (só acontece em
    modo `live`), chama `AsaasRotationService.handle_unauthorized(asaas_account_id)`
    (rotação reativa do `05`) e re-lança como `ServiceUnavailableError` (503 com
    mensagem genérica — nunca vaza o texto de auth do provedor, checklist item 5
    do `06`). `mark_verified` (best-effort, só em modo live) após chamada
    bem-sucedida.
  - Novo `app/asaas/payments_router.py`: `POST /payments/asaas/customers`,
    `POST /payments/asaas/charges` (PIX/BOLETO/CREDIT_CARD via `billing_type`),
    `GET /payments/asaas/charges/{charge_id}`. Só wiring — `Depends`
    `get_asaas_checkout_service(db)`. Convive com o `webhook_router` no mesmo
    prefixo `/payments/asaas` sem colisão de rota.
  - `app/main.py`: `asaas_payments_router` registrado.
  - `app/payments/mercado_pago_client.py` **não tocado** — Asaas e Mercado Pago
    coexistem (ADR-0001 action item 4).
  - Testes novos: `tests/test_asaas_checkout.py` (7 casos): cliente determinístico
    pelo `cpf_cnpj` (não duplica customer), cobrança PIX e BOLETO persistem
    `Payment` com status/valor/billing_type certos, cobrança liga `Order` pelo
    `external_reference`, `GET` prefere a linha local (reflete update do webhook),
    charge desconhecida → 404, e **401 em modo live → dispara
    `handle_unauthorized` uma vez + responde 503 com mensagem genérica**.
  - Verificação real nesta máquina: `poetry run python -m pytest -q` → **77 passed**
    (70 baseline + 7). `ruff check app/ tests/` limpo. `mypy app/asaas/` limpo.
    Rotas confirmadas via `app.routes`.
- Decisão/Bloqueios:
  - Nenhum bloqueador de código. Modo `mock` é o default (nada chama a Asaas real);
    modo `live` continua sem credencial utilizável até o bloqueador `07` ser
    resolvido — o caminho de 401→rotação está implementado e testado com stub, mas
    não exercitado contra a Asaas de verdade.
  - Migração `payment`/`asaas_*` (schema seção 3 do `02`) já tinha sido criada em
    `05` (`d0580cff5258`) — esta fatia não adiciona migração, só passa a popular a
    tabela `payment` pelo checkout além do webhook.
  - `get_charge` no fallback ao provedor depende de `AsaasClient.get_charge` lançar
    `NotFoundError` para id de forma inválida (mock) / 404 (live) — propaga como 404.
  - Cartão (`CREDIT_CARD`) é aceito estruturalmente (paridade de contrato) mas sem
    captura real nem tokenização — restrição explícita do prompt mantida.
