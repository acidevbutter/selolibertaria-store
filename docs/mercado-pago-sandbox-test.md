# Teste sandbox do Mercado Pago Orders API

## Estado verificado em 2026-07-23

- SDK oficial `mercadopago@3.2.0` criou e consultou uma order Pix com `processing_mode: automatic`.
- Resposta de criação e consulta: `action_required`, conforme esperado para pagamento que requer continuação.
- Idempotência foi enviada por `requestOptions`; nenhum pagamento foi submetido.
- O checkout local carregou em `http://localhost:3001/checkout` com Pix, cartão, frete e total dentro do site.

## Teste browser do checkout em 2026-07-23

- Comprador de teste `MLB` reutilizado com e-mail `test_user_6653812095525283137@testuser.com`.
- Produto `Virus do Beijo`, retirada na loja, total de `R$ 42,00`.
- A primeira tentativa falhou no Payment Brick com `missing_payment_information` e `no_payment_method_for_provided_bin`; o erro ocorreu antes da criação do pagamento.
- A segunda tentativa com cartão Visa de teste foi aprovada pelo Mercado Pago e reconciliada pela Orders API.
- Pedido concluído: `ord_6a62120536f7894ead218742`.
- A conta convidada foi criada automaticamente e a sessão encaminhou para `Compras`, com opção de criação de senha.
- O log do servidor confirmou criação da order `ORDTST01KY7HH2K1Q58TWBK4JQTJZD4K`, reconciliação, envio transacional e limpeza do carrinho.
- Avisos de dimensão de imagens e `aria-describedby` não impediram o checkout.

## Matriz local

| Área | Evidência |
|---|---|
| Contrato/mock | 150 testes aprovados no último ciclo |
| Adapter SDK | criação, consulta, cancelamento, estorno, busca e reconciliação cobertos |
| Checkout | Pix/cartão e retomada por order/transaction ID cobertos |
| Segurança | tokenização no navegador; Access Token somente no servidor |
| Build | TypeScript e build aprovados |

Não registrar Access Tokens, Public Keys privadas, PAN, CVV ou tokens de cartão neste documento.
