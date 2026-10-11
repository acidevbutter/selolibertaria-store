# 02 — System design: pagamento Asaas direto no backend Selolibertaria

Segue o framework do skill `engineering:system-design`. Complementa o ADR-0001 (`01`); assume a Opção B (relay de credencial + consumo direto) já decidida.

## 1. Requirements

**Funcionais**
- Receber do `devbutter_backend`, por rota específica, os dados da subconta Asaas provisionada (id da subconta, `walletId`, referência/`id` do access token, e a chave em si — cifrada em trânsito e em repouso) e persistir localmente.
- Consumir a API pública da Asaas (`https://api.asaas.com/v3`, ou sandbox) diretamente do backend FastAPI do Selolibertaria: criar/consultar cliente (`customers`), criar cobrança (Pix, boleto, cartão) ou checkout, consultar status, estornar.
- Receber webhooks de pagamento da Asaas (`PAYMENT_*`) e reconciliar pedido/fatura localmente, idempotente por `id` de evento.
- Receber webhook de rotação de chave vindo do `devbutter_backend` e trocar a credencial ativa sem downtime de checkout.
- Detectar chave inválida (401 da Asaas) e acionar rotação reativa junto ao `devbutter_backend`.
- Confirmar (ack) ao `devbutter_backend` que uma nova credencial foi aplicada com sucesso.

**Não funcionais**
- Nenhuma chamada de checkout pode depender de round-trip síncrono com o `devbutter_backend` (só o provisionamento/rotação depende).
- Idempotência obrigatória em toda rota que recebe evento externo (webhook Asaas, webhook DevButter).
- Segredo de subconta nunca aparece em log, nunca é serializado em resposta HTTP.
- Latência de checkout: chamada à Asaas é a única dependência externa síncrona; timeout curto (ver `ASAAS_REQUEST_TIMEOUT_SECONDS=15` já usado como referência no `devbutter_backend`) com fallback de erro claro para o cliente.
- Disponibilidade: se a credencial estiver "pendente de rotação", o checkout deve falhar de forma explícita e mensurável (métrica), não silenciosamente.
- Custo/operação: reaproveitar o padrão de cifragem (Fernet) e o padrão de assinatura (HMAC) já usados no ecossistema DevButter, para não introduzir um terceiro esquema criptográfico no ecossistema.

**Restrições**
- Stack: FastAPI + SQLAlchemy + Alembic + Postgres, mesmo padrão de `backend/app/{domain}/{router,service,repository,models,schemas}.py` já usado no Selolibertaria (ver `app/payments/`, `app/webhooks/`).
- Não recriar o proxy mTLS `asaas_payment` — chamada é direta, com `httpx`, usando a `apiKey` da subconta no header `access_token` (padrão de autenticação Asaas).
- Mercado Pago continua existindo em paralelo (ver questão em aberto no ADR) — o desenho não remove `app/payments/mercado_pago_client.py`.

## 2. High-Level Design

Novo domínio `app/asaas/` (mesmo padrão dos domínios existentes), mais extensão do domínio `app/webhooks/` já existente e do `app/payments/` (hoje só Mercado Pago). Componentes:

- `app/asaas/client.py` — cliente HTTP direto à Asaas (`httpx.AsyncClient`, base URL por ambiente, header `access_token`, retry com backoff em 5xx, sem retry em 4xx exceto 429).
- `app/asaas/credential_store.py` — leitura/escrita da credencial ativa (tabela `asaas_subaccount_credential`), sempre cifrada em repouso; expõe `get_active_key(account_ref) -> str` já decifrada só no momento do uso (não cacheada em memória além do processo da requisição).
- `app/asaas/integrations_router.py` — rotas servidor-a-servidor com o `devbutter_backend` (relay inicial + push de rotação; ver `05` para o detalhe de implementação).
- `app/asaas/payments_router.py` — rotas de checkout (criar cliente/cobrança) consumidas pelo `selolibertaria-store` (Next.js) ou por outro client interno.
- `app/asaas/webhook_router.py` — `POST /payments/asaas/webhook`, eventos `PAYMENT_*` e `ACCOUNT_STATUS_*`.
- Reuso do `app/webhooks` genérico (`WebhookEvent`) para dedupe, seguindo o mesmo padrão já usado pelo Mercado Pago.

Fluxo de dados: ver `diagrams/fluxo-novo-provisionamento-e-rotacao.mmd` (relay + rotação) e `diagrams/fluxo-novo-pagamento-direto.mmd` (checkout).

## 3. Deep Dive — Data model

Novas tabelas (Alembic, seguindo o padrão de migração já usado — ver `alembic/versions/*mercado_pago*`):

```
asaas_subaccount_credential
  id                  uuid pk
  devbutter_company_id text            -- id que o DevButter usa para essa empresa/loja
  asaas_account_id     text unique     -- id da subconta na Asaas (mesmo valor de Subaccount.id no asaas_payment)
  wallet_id            text
  access_token_ref     text            -- id do AccessToken no asaas_payment (não o valor da chave)
  encrypted_api_key    bytea           -- Fernet, mesma convenção do asaas_payment
  key_version          int             -- incrementado a cada rotação, usado para detectar corrida
  status                enum(active, pending_rotation, revoked)
  last_verified_at     timestamptz     -- último uso bem-sucedido contra a Asaas
  created_at / updated_at timestamptz

asaas_relay_event      -- idempotência das entregas vindas do devbutter_backend (relay + rotação)
  id                  uuid pk
  event_id            text unique     -- id gerado pelo devbutter_backend por entrega
  event_type          enum(subaccount_provisioned, key_rotated)
  payload             jsonb           -- nunca contém a chave em claro após processado (redigir pós-uso)
  processed_ok        boolean
  received_at / processed_at timestamptz

payment                -- tabela dedicada — hoje é só um comentário-stub em app/payments/models.py
  id                  uuid pk
  provider             enum(mercado_pago, asaas)
  provider_payment_id  text
  order_id             fk orders.id
  status                text
  billing_type          text          -- PIX, BOLETO, CREDIT_CARD (Asaas) / equivalente MP
  amount                numeric
  raw_last_event        jsonb
  created_at / updated_at timestamptz
  unique(provider, provider_payment_id)
```

`app/webhooks/models.py` (`WebhookEvent`) já cobre dedupe genérico por `event_id`/`event_type`; reusar para os eventos `PAYMENT_*`/`ACCOUNT_STATUS_*` da Asaas, do mesmo jeito que o Mercado Pago já faz.

## 4. API contracts (resumo — detalhe de implementação fica em `05`)

Servidor-a-servidor (DevButter → Selolibertaria):
- `POST /integrations/devbutter/subaccounts` — relay inicial. Body: `{event_id, devbutter_company_id, asaas_account_id, wallet_id, access_token_ref, api_key, issued_at}`. Resposta `202` + `{received: true}`; processamento assíncrono, ack final via `PATCH` implícito na próxima leitura de status (ou webhook de confirmação — decidir em `05`).
- `POST /integrations/devbutter/subaccounts/{asaas_account_id}/key-updated` — push de rotação. Body: `{event_id, api_key, key_version, reason: "proactive" | "reactive" | "invalidated"}`.

Selolibertaria → DevButter (reativo):
- `POST /integrations/selolibertaria/subaccounts/{asaas_account_id}/rotate-key` — disparado quando o Selolibertaria detecta 401 da Asaas. Corpo mínimo: `{reason: "unauthorized", last_verified_at}`.

Checkout (interno, consumido pelo `selolibertaria-store`):
- `POST /payments/asaas/customers`, `POST /payments/asaas/charges` (Pix/boleto/cartão), `GET /payments/asaas/charges/{id}`.
- `POST /payments/asaas/webhook` — receptor de eventos Asaas.

Todas as rotas servidor-a-servidor exigem assinatura HMAC (header a definir, ex. `X-DevButter-Signature` / `X-Selolibertaria-Signature`) com timestamp e nonce, verificação em tempo constante (`hmac.compare_digest`) — corrigindo o padrão frágil (`!=`) encontrado no webhook Asaas atual do `devbutter_backend`.

## 5. Scale and reliability

- Volume esperado é baixo/médio (é um relay 1:1 por empresa, não um fan-out) — não precisa de fila dedicada no MVP; usar `BackgroundTasks`/retry síncrono com backoff é suficiente, mas desenhar a tabela `asaas_relay_event` já pensando em mover para fila (SQS, mesmo padrão do `butter_relay`) se o volume crescer.
- Idempotência é a principal defesa de confiabilidade: toda entrega (relay, rotação, webhook de pagamento) é identificada por `event_id` único e só processada uma vez.
- Falha de rotação: se o Selolibertaria não confirmar a aplicação da nova chave em N tentativas, `status` vira `pending_rotation` e deve gerar alerta operacional — não deve derrubar checkout silenciosamente (checkout deve continuar tentando com a chave antiga até ela de fato falhar, e só então cair em "pagamento indisponível" explícito).
- Monitoramento: métricas de taxa de 401 da Asaas (proxy para chave morta), tempo entre `pending_rotation` e `active`, e taxa de reprocessamento de webhook.

## 6. Trade-off Analysis

Reaproveitar `app/webhooks` genérico versus criar um webhook dedicado por origem: optamos por reusar `WebhookEvent` para não duplicar a lógica de dedupe já testada com Mercado Pago, aceitando que o `event_type` cresce (mais um provider). Alternativa descartada: um "gateway de pagamento" abstrato unificando Mercado Pago e Asaas atrás de uma interface comum desde já — adiado porque aumentaria o escopo desta série sem necessidade imediata; revisitar se/quando Asaas substituir Mercado Pago (ver questão em aberto do ADR).

## O que revisitar conforme o sistema cresce

- Mover a idempotência de relay/rotação para fila assíncrona real se o número de lojas/subcontas crescer além de dezenas.
- Reavaliar se vale abstrair um `PaymentProvider` comum entre Mercado Pago e Asaas, uma vez que a decisão de coexistência/substituição for tomada.
- Reavaliar o esquema de assinatura servidor-a-servidor se o número de integrações parecidas (DevButter ↔ outros produtos) crescer — hoje é ponto-a-ponto, pode valer um padrão único documentado central.
