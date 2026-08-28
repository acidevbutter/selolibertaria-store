# Prompt 03 — OAuth, jobs e Mercado Pago

Leia os prompts 00–02. Este prompt fecha as exceções que ainda podem deixar
regra de negócio na borda Next.

## Objetivo

Mover para FastAPI o que precisa ser autoridade server-side e deixar no Next
somente a composição da navegação/cookies.

## OAuth

- Implementar no FastAPI início do fluxo, state assinado/armazenado, PKCE,
  callback, troca de código, validação de identidade, vinculação e sessão.
- O Next recebe apenas resultado seguro ou redirecionamento; não chama provider
  com segredo nem decide identidade.
- Testar replay, state inválido, redirect URI inválida, provider desabilitado,
  conta duplicada e falha de callback.

## Jobs

- Mover reconciliação Mercado Pago, retries, expiração e notificações para
  worker/scheduler operado pelo backend.
- Jobs devem ter lock, idempotência, backoff, limite de tentativas, status
  persistido e alerta terminal.
- Remover dependência de cron do Next depois da prova do scheduler FastAPI.

## Mercado Pago

- Validar Orders API, Pix, cartão, webhook, cancelamento e estorno no backend.
- Persistir tentativa, provider order id, status, valor, moeda,
  `external_reference` e eventos sem dados PCI.
- Implementar cartões salvos somente com consentimento, tokenização e contrato
  completo de cobrança/remoção; se não houver prova, manter indisponível.

## Critérios de aceite

- Nenhum segredo de provider no bundle ou runtime do browser.
- OAuth completo e jobs executam sem depender de Route Handler Next.
- Webhook duplicado é aceito sem duplicar pedido ou evento.
- Reconciliação recupera pedido pendente e não transforma cobrança pendente em
  aprovada sem confirmação do provider.
- Sandbox comprova sucesso, falha, timeout, retry e caso duplicado.
