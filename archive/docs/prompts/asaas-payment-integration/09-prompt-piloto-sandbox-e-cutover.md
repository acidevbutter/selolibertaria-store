# 09 — Prompt de execução: piloto sandbox ponta a ponta + cutover controlado

**Repositórios alvo:** `devbutter_app/asaas_payment`, `devbutter_app/devbutter_backend`,
`selolibertaria/backend` (config/infra — quase nenhum código novo)
**Modelo recomendado:** raciocínio médio (é um runbook, não uma feature)
**Pré-requisito:** `03`, `04`, `05`, `07`, `08` implementados e verdes. `06` pode
rodar em paralelo, mas o GO final de `06` depende deste piloto ter acontecido em
sandbox.

## Objetivo

Sair de "código pronto e testado com mock/fakes" para "uma cobrança real criada na
**sandbox** da Asaas por uma subconta real, provisionada pelo `devbutter_backend`,
com a credencial relayada e usada pelo `selolibertaria/backend`". Nenhuma chave de
produção, nenhuma rotação de chave real fora da sandbox.

## Escopo de leitura

- `00-levantamento-tecnico.md` seção D (itens urgentes — D.1, D.2, D.8 em especial)
- `01-adr-integracao-asaas.md` (Action Items) e `06-prompt-validacao-seguranca-e2e.md`
- `CONTRATO-HMAC.md` (segredo compartilhado, headers)
- `.env.example` dos três repos (variáveis `ASAAS_*`, `*_CLIENT_CNS`,
  `DEVBUTTER_SELOLIBERTARIA_RELAY_HMAC_SECRET`, `*_ENCRYPTION_KEY`)
- `devbutter_app/asaas_payment/README.md` e `plano-integracao-asaas-payment.md`
  (mTLS, geração de CA/cert por cliente)

## Entregáveis (todos com evidência anexada no log deste arquivo)

1. **Pré-checks de negócio resolvidos** (bloqueadores D.1 e D.2 do levantamento):
   - Registrar a resposta da Asaas sobre a janela de 2h para gerenciamento de
     token de subconta (item D.1). Enquanto não houver resposta, assumir "janela
     manual" e documentar o procedimento.
   - Confirmar que a(s) subconta(s) do piloto é(são) **CNPJ** (Asaas bloqueia CPF
     na criação via API — D.2).
2. **Identidades mTLS / CNs emitidos e alocados**:
   - CN do `devbutter_backend` em `ADMIN_CLIENT_CNS` **e** em `RELAY_CLIENT_CNS`
     do `asaas_payment` (Action Item 3 do ADR + entregável do `07`).
   - Nenhum CN de loja em `RELAY_CLIENT_CNS`.
   - Tabela CN → serviço → ambiente anexada no log.
3. **Segredos gerados e distribuídos fora de banda** (só o nome vai para
   `.env.example`, nunca o valor):
   - `DEVBUTTER_SELOLIBERTARIA_RELAY_HMAC_SECRET` — **mesmo valor** nos dois `.env`
     (`devbutter_backend` e `selolibertaria/backend`).
   - `ASAAS_CREDENTIAL_ENCRYPTION_KEY` (Fernet) no `selolibertaria/backend` —
     **independente** da `FIELD_ENCRYPTION_KEY` do `asaas_payment`.
   - `ASAAS_WEBHOOK_ACCESS_TOKEN` no `selolibertaria/backend`, e o webhook
     correspondente cadastrado na subconta sandbox com esse token.
4. **URLs e base URLs de sandbox conferidas**:
   - `asaas_payment`: `ASAAS_BASE_URL` apontando para sandbox.
   - `selolibertaria/backend`: `ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3`,
     `ASAAS_CLIENT_MODE` ainda em `mock` até o passo 6.
   - `devbutter_backend`: `SELOLIBERTARIA_BACKEND_BASE_URL` apontando para o
     backend da loja em staging/local.
5. **Smoke test do provisionamento + relay** (ainda com `ASAAS_CLIENT_MODE=mock`
   na loja, para isolar o relay do checkout):
   - Provisionar uma subconta sandbox via `devbutter_backend`
     (`AdminCompaniesService.link_subaccount`).
   - Verificar: `asaas_payment` reteve `encrypted_api_key`; `devbutter_backend`
     chamou `POST /subaccounts/{id}/relay-credential` (log de `08`); a loja
     recebeu `POST /integrations/devbutter/subaccounts`, gravou
     `asaas_subaccount_credential` (cifrada) e respondeu `202`;
     `AsaasSubaccountLink.selolibertaria_relay_status == "acked"`.
   - Rotação reativa: forçar um `401` simulado no cliente da loja
     (`app/asaas/client.py` em modo live com chave inválida) e verificar o
     caminho `pending_rotation` → `rotate-key` → `key-updated` → `key_version`
     incrementado. Pode ser feito com a Asaas sandbox devolvendo 401 de fato para
     uma chave revogada.
6. **Checkout real em sandbox** (vira `ASAAS_CLIENT_MODE=live` na loja):
   - `POST /payments/asaas/customers` e `POST /payments/asaas/charges`
     (`billing_type=PIX` e `BOLETO`) contra a subconta sandbox → cobranças criadas
     de verdade, `Payment` local gravado.
   - Disparar (ou aguardar) os webhooks `PAYMENT_*` da Asaas sandbox e verificar a
     reconciliação `Payment`/`Order` idempotente.
7. **Plano de cutover / rollback documentado** (não executar produção aqui):
   - Como virar uma loja para Asaas em produção (feature flag por loja/conta — ver
     questão em aberto do ADR: substitui ou coexiste com Mercado Pago).
   - Como reverter: `ASAAS_CLIENT_MODE=mock` / desligar a flag / manter Mercado
     Pago como fallback.
   - O que monitorar no piloto: taxa de `401` da Asaas, tempo em
     `pending_rotation`, `blocked`/`rotation_blocked` em `AsaasSubaccountLink`,
     reprocessamento de webhook.

## Restrições explícitas

- **Sandbox apenas.** Nenhuma chave de produção, nenhuma subconta real de cliente,
  nenhuma rotação de chave real sem aprovação explícita registrada neste log
  (mesma disciplina do `README.md` da série e do `06`).
- Não commitar valor de segredo em nenhum repo. `.env.example` só ganha a chave.
- Se D.1 (janela de 2h) não tiver resposta da Asaas, a rotação **proativa
  automática** não pode ser prometida como SLA — documentar como "assistida por
  humano" e seguir só com a reativa no piloto.
- Este arquivo é o único lugar onde se registra que o piloto tocou a Asaas
  sandbox — anexar request ids / ids de cobrança / prints de log como evidência.

---

## Log de execução

_(anexar aqui cada rodada do piloto, com Data, Chat, Modelo, o que foi provisionado
na sandbox, evidências e veredito parcial. Não sobrescrever.)_
