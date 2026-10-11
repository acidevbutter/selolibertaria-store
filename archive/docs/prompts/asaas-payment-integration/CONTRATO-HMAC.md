# Contrato de assinatura HMAC — DevButter ↔ Selolibertaria (relay/rotação)

Decidido para destravar implementação paralela de `03` (devbutter_backend) e `05` (selolibertaria/backend). Ambos os lados DEVEM implementar exatamente isto — não reinventar por fatia.

## Algoritmo

- HMAC-SHA256, hex digest.
- Mensagem assinada: `f"{timestamp}.{nonce}.{raw_body_bytes.decode('utf-8')}"` (raw body = JSON exato enviado, antes de qualquer re-serialização).
- Verificação SEMPRE com `hmac.compare_digest(assinatura_recebida, assinatura_calculada)` — nunca `==`/`!=`.
- `timestamp`: epoch seconds (string). Rejeitar requisição se `abs(now - timestamp) > 300` (5 min).
- `nonce`: string opaca (uuid4 hex) gerada pelo emissor a cada requisição. Defesa em profundidade contra replay dentro da janela de 5 min; a idempotência de negócio (dedupe por `event_id` em `asaas_relay_event` / `WebhookEvent`) é quem garante não-duplicação de efeito.

## Headers

Direção DevButter → Selolibertaria (`POST /integrations/devbutter/subaccounts`, `POST /integrations/devbutter/subaccounts/{id}/key-updated`):
- `X-DevButter-Signature`
- `X-DevButter-Timestamp`
- `X-DevButter-Nonce`

Direção Selolibertaria → DevButter (`POST /integrations/selolibertaria/subaccounts/{id}/rotate-key`):
- `X-Selolibertaria-Signature`
- `X-Selolibertaria-Timestamp`
- `X-Selolibertaria-Nonce`

## Segredo

Env var dedicada em ambos os repos: `DEVBUTTER_SELOLIBERTARIA_RELAY_HMAC_SECRET` (mesmo valor nos dois `.env`, compartilhado fora de banda — não commitar valor real, só a chave em `.env.example`). NÃO reusar `TRUSTED_PROXY_SECRET`, `AUDIT_SIGNING_KEY` (asaas_payment) nem `FIELD_ENCRYPTION_KEY`/`ASAAS_CREDENTIAL_ENCRYPTION_KEY` (que cifram dado em repouso, propósito diferente).

## event_id

UUID4 string gerado pelo emissor de cada evento (`devbutter_backend` para relay inicial e key-updated; `selolibertaria/backend` para o rotate-key reativo). É o campo de idempotência — mesmo `event_id` reprocessado deve ser no-op.

## Body de erro em assinatura inválida

401 com `{"detail": "invalid_signature"}` — nunca ecoar a assinatura recebida nem o segredo em nenhuma resposta ou log.
