# DEV-154 — Validação do SDK oficial

Validação realizada em 2026-07-23 com `mercadopago@3.2.0`, compatível com Node.js 18+
(runtime usado pelo projeto).

## Cobertura encontrada

| Operação | SDK oficial | HTTP direto | Decisão |
|---|---|---|---|
| criar order | `new Order(config).create({ body, requestOptions })` | desnecessário | SDK |
| consultar order | `order.get({ id, requestOptions })` | desnecessário | SDK |
| cancelar | `order.cancel({ id, requestOptions })` | desnecessário | SDK |
| reembolsar total/parcial | `order.refund({ id, body, requestOptions })` | desnecessário | SDK |
| buscar | `order.search(searchData)` | desnecessário | SDK |
| processar/capturar | `order.process` / `order.capture` | desnecessário | SDK |
| reconciliação | `order.get` após evento | desnecessário | SDK atrás do contrato DEV-153 |

O SDK também expõe `createTransaction`, `updateTransaction` e `deleteTransaction`, que ficam
disponíveis para uma necessidade futura, mas não entram no adapter até o domínio exigir.

## Configuração e tipos

- `MercadoPagoConfig({ accessToken, options: { timeout, idempotencyKey } })` foi instanciado
  com sucesso; o SDK documenta timeout padrão de 10 segundos e opções por requisição.
- `Order.create` aceita `type: "online"`, `processing_mode: "automatic"`,
  `total_amount`, `external_reference`, `payer` e `transactions.payments`.
- O Payment Brick existente fornece `payment_method_id`, token e parcelas; esses dados
  correspondem a `transactions.payments[].payment_method` sem enviar PAN/CVV ao backend.
- Erros do SDK são Promises rejeitadas com mensagem/status de resposta; o adapter DEV-155
  deverá normalizá-los para `OrdersApiError` sem expor payload bruto ao cliente.

## Prova sandbox

Com o Access Token configurado no ambiente local, foi criada e consultada uma order Pix
mínima usando `processing_mode: "automatic"`:

- order: `ORDTST01KY720Q140E3J4GVYK8JSSHM8`;
- referência: `dev154-1784795912704`;
- criação: `action_required`;
- consulta por ID: `action_required`;
- idempotência: chave única enviada em `requestOptions`.

O estado `action_required` é a resposta esperada para uma order que requer a continuação do
fluxo de pagamento; não foi submetido pagamento nem cancelamento/estorno.

## Decisão para DEV-155

Usar `mercadopago@3.2.0` exclusivamente no adapter server-side atrás de
`OrdersApiClient`. O adapter deve mapear o contrato normalizado de DEV-153, passar a chave
de idempotência por requisição, configurar timeout explícito e transformar erros do SDK.
Não há lacuna que justifique HTTP direto para criar, consultar, cancelar, reembolsar,
buscar ou reconciliar orders.
