# DEV-146 — Reconciliação de orders pendentes

## Validado

- O adapter da Orders API consulta `/v1/orders/{id}`, normaliza transação/status e rejeita divergência de valor, moeda ou `external_reference`.
- A suíte existente cobre aprovação tardia, order pendente, expiração, divergência e repetição idempotente do webhook.
- O caminho legado ainda dependia de nomes e entradas de `payment_id`; ele não foi reutilizado como máquina separada.

## Reaproveitado

- `MercadoPagoOrdersSdkClient.getOrder`, timeout/logs do adapter e `assertOrdersIntegrity`.
- `recordMercadoPagoCheckout` como único processador de efeitos locais, com lookup/upsert idempotente de compra, conta, e-mail e carrinho.
- Persistência de drafts e índices Mongo existentes, com leitura compatível do campo legado.

## Reconstruído

- `reconciliation.ts` seleciona somente drafts pendentes, registra tentativas, aplica backoff, encerra após cinco falhas e persiste alerta.
- Webhook, cron protegido e ação manual do admin aceitam `mercadoPagoOrderId` e convergem para o mesmo processador.
- O novo campo `mercadoPagoOrderId` é a fonte de gravação; `mercadoPagoPaymentId` fica apenas como fallback de dados históricos.

Execução automática: chamar `GET /api/cron/mercado-pago-reconciliation` com `Authorization: Bearer $MERCADO_PAGO_RECONCILIATION_SECRET`.
Execução manual: botão em `/admin/webhooks` ou `POST /api/admin/mercado-pago/reconcile`.
