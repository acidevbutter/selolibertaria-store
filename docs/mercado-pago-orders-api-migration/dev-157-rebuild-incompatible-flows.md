# DEV-157 — Reconstruir fluxos incompatíveis

## Decisão

O caminho ativo de criação e consulta em `/v1/payments` foi removido. Checkout, Pix,
reconciliação e webhook usam `src/lib/mercado-pago-orders/checkout.ts` e o adapter Orders.

Cartões salvos continuam isolados na implementação de customer até haver contrato oficial
compatível com Orders API; não existe fallback silencioso para Payments API.

Também foram removidos os DTOs e validadores específicos de Payments API. A validação de
integridade agora é feita por `assertOrdersIntegrity`, com `orderId` e `transactionId` como
identificadores canônicos.
