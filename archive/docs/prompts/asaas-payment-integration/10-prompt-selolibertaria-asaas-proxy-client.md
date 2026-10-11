# 10 — Prompt de implementação: migrar `app/asaas` para consumir o proxy `asaas_payment` via mTLS

**Repositório alvo:** `selolibertaria/backend`
**Modelo recomendado:** implementação (raciocínio médio-alto)
**Pré-requisito:** `04` (cliente Asaas direto), `05` (webhook) já implementados —
este prompt substitui o transporte deles, não o domínio. Ler
`docs/architecture/adr-0002-asaas-subconta-proxy-nota-fiscal.md` (repo `devbutter_app`)
e a decisão de Plano A (feature flag) vs Plano B (corte direto) já combinada antes de
escolher a estratégia de rollout — este prompt cobre a implementação em si, não a
decisão de rollout.

## Escopo de leitura

- `app/asaas/client.py`, `checkout_service.py`, `credential_store.py`,
  `rotation_service.py` — o que existe hoje e vai ser substituído/removido.
- `app/payments/mercado_pago_client.py` — para não quebrar o padrão de domínio que
  convive com este (Asaas e Mercado Pago coexistem).
- `devbutter_app/asaas_payment/docs/architecture/adr-0002-addendum-rotas-dedicadas.md`
  — catálogo de rotas que o proxy expõe (o client novo aqui consome essas rotas, não
  `/v3/...` do Asaas diretamente).
- Certificado mTLS: confirme com o time que já existe um par `sales-api.crt/key`
  emitido e `sales-api` está em `ALLOWED_CLIENT_CNS` do `asaas_payment` antes de
  escrever qualquer coisa que dependa dele — sem isso só dá pra testar com mock.

## Entregáveis

1. Novo `app/asaas/proxy_client.py`: `httpx.AsyncClient` com `cert=(...)`,
   `verify=<ca.crt>`, apontando para `ASAAS_PROXY_URL` (nova env var). Implementa a
   mesma interface pública que `AsaasClient` já expõe hoje (`create_customer`,
   `create_charge`, `get_charge`) — mesmos schemas Pydantic de entrada/saída, para
   `checkout_service.py` não precisar mudar de assinatura.
2. Se o Plano A (feature flag) foi o escolhido: env `ASAAS_TRANSPORT=direct|proxy`, e
   `AsaasCheckoutService` seleciona a implementação por essa flag. Se o Plano B (corte
   direto) foi o escolhido: substituir diretamente, sem flag.
3. Novas envs: `ASAAS_PROXY_URL`, `ASAAS_PROXY_CLIENT_CERT`, `ASAAS_PROXY_CLIENT_KEY`,
   `ASAAS_PROXY_CA` — documentar em `.env.example` com o mesmo estilo de comentário já
   usado para as envs de Asaas existentes.
4. Testes: replicar a suíte de `tests/test_asaas_checkout.py` contra o
   `AsaasProxyClient` usando `httpx.MockTransport` (não bater na rede real em teste).
5. Se e somente se o Plano B (corte direto) foi escolhido: remover
   `AsaasCredentialStore`, `AsaasRotationService`, o `AsaasClient` antigo e
   `ASAAS_CREDENTIAL_ENCRYPTION_KEY`. Se o Plano A foi escolhido, isso fica para um
   prompt de descomissionamento posterior, depois do canário — não remover ainda.

## Restrições explícitas

- Não mudar a assinatura pública de `AsaasCheckoutService` — o objetivo é trocar o
  transporte por baixo, não o contrato que `payments_router.py` já usa.
- Não tocar em `app/asaas/webhook_router.py`/`webhook_service.py` — o webhook continua
  chegando direto do Asaas, sem passar pelo proxy (decisão já tomada no ADR).
- Não remover `mercado_pago_client.py` nem qualquer código Mercado Pago.

---

## Log de execução

_(anexar aqui após cada rodada de implementação, mesmo formato dos demais arquivos desta série.)_
