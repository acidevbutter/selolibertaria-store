# Teste sandbox do Mercado Pago Orders API

## Estado verificado em 2026-07-23

- SDK oficial `mercadopago@3.2.0` criou e consultou uma order Pix com `processing_mode: automatic`.
- Resposta de criação e consulta: `action_required`, conforme esperado para pagamento que requer continuação.
- Idempotência foi enviada por `requestOptions`; nenhum pagamento foi submetido.
- O checkout local carregou em `http://localhost:3001/checkout` com Pix, cartão, frete e total dentro do site.

## Matriz local

| Área | Evidência |
|---|---|
| Contrato/mock | 150 testes aprovados no último ciclo |
| Adapter SDK | criação, consulta, cancelamento, estorno, busca e reconciliação cobertos |
| Checkout | Pix/cartão e retomada por order/transaction ID cobertos |
| Segurança | tokenização no navegador; Access Token somente no servidor |
| Build | TypeScript e build aprovados |

Não registrar Access Tokens, Public Keys privadas, PAN, CVV ou tokens de cartão neste documento.
