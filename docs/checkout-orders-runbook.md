# Runbook — Checkout e Orders API

## Correlação segura

Use somente `orderId`, `providerOrderId`, operação, status, código de erro e duração. Nunca registre e-mail, CPF/CNPJ, telefone, endereço, token de cartão, QR Pix ou segredos.

O adapter emite `mercado_pago_orders` com `create`, `get`, `cancel`, `refund`, `search` ou `reconcile`.

## Sinais e severidade

| Sinal | Severidade | Ação inicial |
| --- | --- | --- |
| Erro de criação, timeout ou rate limit | Alta após 3 ocorrências em 10 min | Filtrar logs por `operation=create` e `errorCode`; não repetir manualmente sem o `orderId`. |
| Webhook inválido, duplicado ou divergente | Alta | Consultar a order pelo `providerOrderId`; manter o webhook como entrada e a reconciliação como fonte de transição. |
| Reconciliação em `alerted` | Alta | Abrir `/admin/webhooks`, executar reconciliação manual uma vez e investigar o último erro. |
| Order pendente além do backoff | Média | Aguardar `nextAttemptAt` ou executar a ação manual autenticada; não criar nova cobrança. |
| Falha de cancelamento/estorno | Alta | Confirmar estado na Orders API antes de repetir; registrar `orderId` e `providerOrderId`. |

## Recuperação

1. Localize o draft pelo `orderId` e confirme valor, moeda e `external_reference`.
2. Consulte a Orders API pelo `providerOrderId`.
3. Para pendentes, use `/admin/webhooks` ou `POST /api/admin/mercado-pago/reconcile`; o cron protegido aplica backoff e alerta após cinco falhas.
4. Cancele somente order pendente; estorne somente order aprovada. Reexecute uma vez com a mesma chave idempotente.
5. Só faça rollback local após confirmar o estado externo. Não ajuste estoque, pedido ou carrinho manualmente antes da reconciliação.

## RUM

O RUM do navegador deve registrar apenas etapa do checkout e identificadores internos seguros quando existirem. Remova eventos que contenham identificadores pessoais, endereço, dados financeiros, tokens, QR ou código Pix.
