# 00 — ADR: chave Asaas somente no `asaas_payment`

**Tipo:** planejamento; não editar código.

## Decisão

- A `apiKey` da subconta fica cifrada apenas no banco do `asaas_payment`.
- O `asaas_payment` é o único processo que a decifra, somente em memória, para chamar a Asaas.
- Selo chama APIs de comércio do proxy por mTLS/CN; envia dados do pedido, jamais a chave.
- Webhooks Asaas chegam ao proxy; o proxy valida, deduplica e publica evento interno assinado à Selo.
- O relay direto (`relay-credential`, HMAC de credencial, banco de credencial na Selo e chamada Selo→Asaas) será removido após migração validada.

## Entregável

Atualize apenas a documentação arquitetural afetada, registrando que a série
`asaas-payment-integration` é histórica/superseded. Não altere rotas ou configurações.

## Critérios de aceite

- A documentação identifica o proxy como dono exclusivo da credencial.
- Há uma estratégia de rollback: manter a rota antiga desabilitada por configuração somente durante a validação sandbox; não manter dois caminhos ativos em produção.
- Não há afirmação de que pagamento real, CN ou segredo de produção já foram configurados.
