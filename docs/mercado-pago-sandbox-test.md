# Teste sandbox do Mercado Pago

## Estado verificado em 2026-07-23

- Comprador sandbox: `3549380541`, e-mail `test_user_3549380541@testuser.com`.
- Vendedor sandbox criado/identificado: `3549820193`.
- Carrinho: 3 unidades de `Virus do Beijo`.
- Total: R$ 141,33.
- A função server-side `createMercadoPagoPayment` foi chamada diretamente com `tsx`.
- A API respondeu `403`, código `4390`, `Payer email forbidden`.

## O que precisa ser feito para o teste funcionar

1. Usar um Access Token do vendedor de teste, não o token da conta integradora/owner (`/users/me` confirmou owner `168572323`).
2. O vendedor e o comprador precisam ser usuários sandbox do mesmo contexto Mercado Pago e do mesmo país (MLB).
3. Persistir no `.env` o Access Token e a Public Key correspondentes ao mesmo vendedor/app; reiniciar o processo depois de alterar o arquivo.
4. Em ambiente local, não enviar `notification_url` `localhost`; para testar webhook, usar uma URL HTTPS pública/túnel e configurar a assinatura.
5. Reexecutar a função `createMercadoPagoPayment` com `payment_method_id: "pix"` ou token de cartão criado pela Public Key correspondente.
6. Confirmar a resposta do Mercado Pago e consultar `orderDrafts`/`orders` no Mongo pelo `orderId` e `mercadoPagoPaymentId`.

## Comando de validação direta

```bash
yarn tsx -e 'import { loadEnvConfig } from "@next/env"; (async () => { loadEnvConfig(process.cwd()); const { createMercadoPagoPayment } = await import("./src/lib/mercado-pago.ts"); /* montar body sandbox e chamar a função */ })();'
```

Não registrar Access Tokens, Public Keys privadas, PAN, CVV ou tokens de cartão neste documento.
