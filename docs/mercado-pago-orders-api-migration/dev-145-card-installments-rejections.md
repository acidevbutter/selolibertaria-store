# DEV-145 — Parcelamento e recusas de cartão

## Validado

- O fluxo atual já tokenizava cartão no Card Payment Brick e criava a transação dentro de `/v1/orders`.
- O adapter Orders já enviava token e parcelas selecionadas; a suíte existente cobria cartão aprovado/recusado e retry idempotente.
- Não foi usado o conector `mercado-pago-mcp` nesta execução porque ele não está disponível nesta sessão; não foi criado usuário de teste nem persistida credencial.

## Reaproveitado

- Card Payment Brick, tokenização no navegador, `createCheckoutOrder`, idempotency key por tentativa e proteção contra cobrança duplicada.
- Normalização de status do adapter e contrato server-side da Orders API.

## Corrigido/reconstruído

- Limite de parcelas agora considera o valor da compra e o teto de 12 parcelas do checkout.
- O servidor rejeita quantidade inválida antes de chamar o provedor.
- `status_detail` e parcelas aprovadas são persistidos sem dados sensíveis.
- Recusas conhecidas viram mensagens seguras em pt-BR; detalhes brutos não são exibidos.
- O emissor continua sendo informado pelo token/retorno do Brick; `issuer_id` não é forçado no payload porque não faz parte do contrato `CreateOrderRequest` do SDK Orders instalado.
