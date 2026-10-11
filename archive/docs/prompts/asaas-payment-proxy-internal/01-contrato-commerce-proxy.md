# 01 — Contrato HTTP do proxy de comércio

**Tipo:** planejamento e testes de contrato; não chamar Asaas.

## Consumidor e autenticação

O consumidor é exclusivamente o backend da Selo, identificado por CN mTLS dedicado.
O browser nunca chama `asaas_payment`; DevButter não recebe `apiKey`.

## Rotas a definir e implementar

| Rota | Entrada essencial | Saída essencial |
|---|---|---|
| `POST /commerce/asaas/customers` | subconta, dados do comprador, `request_id` | `customer_id` |
| `POST /commerce/asaas/payments` | subconta, `customer_id`, pedido, valor, vencimento, método, `request_id` | `payment_id`, status, vencimento e dados de instrução de pagamento disponíveis |
| `GET /commerce/asaas/payments/{payment_id}` | subconta | status, valor, vencimento, referências seguras |
| `POST /commerce/asaas/payments/{payment_id}/refund` | subconta, motivo, `request_id` | referência e estado do estorno |
| `POST /commerce/asaas/webhooks` | evento Asaas | ACK rápido; publicação do evento interno |

Defina schemas tipados e uma política explícita de ownership: um CN só pode usar a
subconta que lhe foi atribuída. Não exponha endpoint proxy genérico para a Selo.

## Erros normalizados

Toda falha usa `{code, message, retryable, request_id, payment_id?, provider_status?, provider_code?}`.

- `400`: corpo inválido; `401/403`: mTLS/CN inválido; `404`: recurso sem ownership;
  `409`: reutilização conflitante de `request_id`; `422`: recusa/regra de pagamento;
  `429`: limite; `502/503/504`: falha de upstream.
- Nunca retornar `apiKey`, cabeçalhos Asaas, payload bruto sensível ou stack trace.
- Definir idempotência local por `request_id` antes de escolher qualquer semântica de
  idempotência própria da Asaas; validar posteriormente os campos suportados pelo provedor.

## Evento interno

Defina um contrato versionado `payment.updated` com `event_id`, `payment_id`,
`order_id`/`external_reference`, status, timestamp e versão. O proxy assina a entrega à
Selo; a Selo deduplica por `event_id`.
