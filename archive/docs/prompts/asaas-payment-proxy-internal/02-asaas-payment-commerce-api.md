# 02 — Implementar APIs de comércio no `asaas_payment`

**Repositório alvo:** `devbutter_app/asaas_payment`

## Escopo

Implemente somente as rotas do contrato `01`, em módulo próprio de comércio. Reuse o
armazenamento cifrado de subconta e mTLS existentes; não reutilize nem amplie a rota de
proxy genérico para a Selo.

## Entregáveis

1. Allowlist de CN exclusiva para a Selo e verificação de ownership de subconta.
2. Serviços tipados para criar cliente, criar/consultar/estornar pagamento e receber webhook.
3. Leitura/decifragem da `apiKey` somente no serviço interno que chama a Asaas.
4. Persistência de `request_id` e resultado seguro para idempotência.
5. Mapeador único de falhas Asaas para o contrato de erro normalizado.
6. Webhook autenticado, deduplicado e encaminhado à Selo por evento interno assinado.
7. Auditoria estruturada sem segredo, PAN, CVV ou corpo sensível.
8. Testes: CN/ownership, idempotência, resposta de sucesso, cada classe de erro,
   webhook duplicado e prova de que `apiKey` não aparece em resposta/log/auditoria.

## Restrições

- Não chamar produção nem imprimir segredos.
- Não remover `relay-credential` nesta fatia.
- Não aceitar uma rota livre que permita à Selo escolher método/path arbitrário da API Asaas.
- Se o contrato oficial Asaas divergir em campos ou erros, pare e registre a divergência;
  não invente compatibilidade.

## Verificação

Rode a suíte relevante, lint e tipos configurados pelo repositório. Registre comandos e
resultados reais; não alegue E2E sem sandbox.
