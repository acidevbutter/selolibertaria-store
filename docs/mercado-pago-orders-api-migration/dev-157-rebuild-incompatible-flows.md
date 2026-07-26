# DEV-157 — Reconstruir fluxos incompatíveis

## Decisão

O caminho ativo de criação e consulta em `/v1/payments` foi removido. Checkout, Pix,
reconciliação e webhook usam `src/lib/mercado-pago-orders/checkout.ts` e o adapter Orders.

Cartões salvos continuam isolados na implementação de customer até haver contrato oficial
compatível com Orders API; não existe fallback silencioso para Payments API.

Também foram removidos os DTOs e validadores específicos de Payments API. A validação de
integridade agora é feita por `assertOrdersIntegrity`, com `orderId` e `transactionId` como
identificadores canônicos.

## Funções reconstruídas

| Função | Implementação nova | Garantias verificadas |
|---|---|---|
| criação, consulta, cancelamento, estorno e busca | `sdk-client.ts` atrás de `OrdersApiClient` | entrada tipada, timeout de 8 s, idempotência nas escritas, normalização de erros e logs sem dados sensíveis |
| criação/consulta do checkout | `checkout.ts` | domínio recebe somente `OrdersPaymentResult`, sem DTO do provedor |
| webhook | `app/api/mercado-pago/webhook/route.ts` + `reconcileWebhook` | assinatura, deduplicação por evento e integridade de referência, valor, moeda e transação |
| reconciliação pendente | `reconciliation.ts` | consulta a order por ID, lock curto, backoff, máximo de cinco tentativas e alerta persistido |
| cancelamento e estorno no admin | rota `api/admin/orders/[id]/payment` | busca pelo ID de order, integridade antes de mutar e chave de idempotência |

`src/lib/mercado-pago-orders/{contract,mock,sdk-client,checkout,reconciliation}.test.ts` cobre
o contrato, cenários determinísticos, normalização, divergências de integridade, transições e
retries. A suíte integrada local passou com 157 testes aprovados e 1 ignorado; a homologação
externa permanece registrada na matriz DEV-148, sem apresentar como aprovada o que depende do
provedor.

## Legado isolado

`mercadoPagoPaymentId` é mantido somente como leitura de compatibilidade para drafts e pedidos
anteriores à migração. Novas gravações usam `mercadoPagoOrderId`; não há máquina de estados
paralela nem fallback de produção para criação/consulta em Payments API. O código de customer
para cartões salvos permanece explicitamente fora do fluxo de orders até validação oficial.
