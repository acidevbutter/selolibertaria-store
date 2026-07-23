# DEV-153 — Contratos e mock da Orders API

`src/lib/mercado-pago-orders/contract.ts` é a fronteira entre o domínio e o provedor. Ela
expõe somente pedido interno, referência externa, valor/moeda, método de pagamento, status
normalizado, transação, Pix e erros classificados. Não importa nem reexporta DTOs da
Payments API legada e não aceita PAN ou CVV.

`MockOrdersApiClient` implementa a mesma interface do futuro adapter real. É determinístico,
usa `idempotencyKey` para não criar uma segunda order em retry, valida referência/valor/moeda
em webhooks e deduplica `eventId`.

Os cenários `pix_pending`, `pix_approved`, `pix_expired`, `pix_cancelled`, `card_approved`,
`card_pending`, `card_declined`, `technical_failure` e `timeout_retry` são fixtures de teste,
não configuração de produção. Cancelamento só é aceito enquanto pendente; estorno só é
aceito após aprovação e é idempotente quando repetido.

O mock substitui temporariamente as chamadas de criação, consulta, cancelamento, estorno e
reconciliação da Orders API durante DEV-153. DEV-155 deverá conectar um adapter oficial à
mesma interface, sem mover regras do domínio para o SDK.
