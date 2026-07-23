# DEV-155 — Adapter real da Orders API

`MercadoPagoOrdersSdkClient` implementa a interface `OrdersApiClient` de DEV-153 e concentra
todas as chamadas ao recurso `Order` do SDK. A fábrica `server-client.ts` é o único ponto que
instancia `MercadoPagoConfig`, protegida por `server-only` e pelo `MERCADO_PAGO_ACCESS_TOKEN`.

O adapter cobre criação, consulta, cancelamento, estorno total/parcial, busca e reconciliação.
Cada escrita recebe timeout e `idempotencyKey` por requisição; erros de timeout, rate limit e
5xx são marcados como retryable. Logs registram somente operação, ids internos/externos,
status, código normalizado e duração — nunca token, e-mail, PAN, CVV ou payload bruto.

Respostas exigem `id`, `external_reference`, transação, valor e moeda. A camada converte
status e métodos de pagamento para o contrato interno, expõe somente dados Pix necessários e
bloqueia divergência de referência, valor, moeda, order ou transação durante a reconciliação.

O adapter não persiste diretamente: devolve `providerOrderId`, `externalReference`,
transaction id, valor, moeda e status normalizados para que DEV-156 grave o snapshot em
`orderDrafts`/`purchases` sem acoplar o SDK ao Mongo ou às Server Actions.
