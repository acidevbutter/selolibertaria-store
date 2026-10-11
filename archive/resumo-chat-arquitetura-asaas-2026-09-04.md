# Resumo — arquitetura Asaas (chat 2026-09-04)

## 1. Status geral do projeto
Backend FastAPI + PostgreSQL rodando (`/health` 200). Alembic em dia. Domínios completos:
users, auth, orders, catalog, carts, payments. Mercado Pago com idempotência, dedup de
webhook por `event_id` e worker de reconciliação. NO-GO em aberto: homologação Sandbox MP,
cutover Mongo→Postgres real, agendamento do worker em produção, smoke E2E.

## 2. Levantamento feito sobre Asaas

- `app/asaas/` no `selolibertaria/backend` tem ~1572 linhas, 15 arquivos: duas peças mortas
  coexistindo — `AsaasClient` direto (mock, nunca ligado em `live`) e um relay de credencial
  do `devbutter_backend` que está quebrado (`asaas_payment` redige a `apiKey` de toda
  resposta de `/subaccounts`).
- Existe uma tentativa de migração pro proxy mTLS `asaas_payment` (`AsaasProxyClient`,
  `mapping.py`) que foi **feita e revertida** em 2026-09-01 (`backend/docs/asaas-payment-proxy-revertido.md`)
  por motivos operacionais: cert `sales-api` não emitido, subconta não "adotada", deploy dos
  3 repos (`selolibertaria`, `devbutter_backend`, `asaas_payment`) fora de sequência.
- A decisão de arquitetura **já estava tomada** antes desse chat: `devbutter_app/docs/architecture/adr-0002-asaas-subconta-proxy-nota-fiscal.md`
  (Status: Proposed, autor: Marcos, 2026-09-01) — Option B: quem consome pagamento nunca vê
  a `apiKey`; autentica por mTLS e manda só dado de negócio; `asaas_payment` resolve a chave,
  audita e aplica split.
- Achado extra: o bloqueador do relay (item `07` da série de prompts, "apiKey não é
  relayável") **já foi resolvido** no `asaas_payment` — existe
  `POST /subaccounts/{id}/relay-credential`, gated por `RELAY_CLIENT_CNS`, única exceção ao
  `hide_api_key`.

## 3. Documentos produzidos neste chat

Salvos em `selolibertaria/backend/docs/`:

- `asaas-proxy-migration-plano-execucao.md` — plano de execução em 4 fases (infra → transporte
  atrás de flag `ASAAS_TRANSPORT` → canário → cutover → decomissionamento) pra retomar a
  migração revertida, endereçando os 3 motivos do revert. Inclui tabela de responsabilidade
  por camada e a correção de padrão (auth inline → `Depends()`).
- `diagramas/asaas-proxy/05-estrutura-asaas-payment.mmd` — diagrama da estrutura interna do
  `asaas_payment` (domínios `core`, `proxy`, `subaccounts`, `splits`, `ecommerce`,
  `payment_methods`, `audit`).
- `diagramas/asaas-proxy/06-proposta-webhook-chave-local.mmd` — diagrama de uma **proposta
  alternativa** trazida por você nesta conversa (ainda não decidida/comparada com o ADR-0002):
  loja recebe a `apiKey` via webhook (só `devbutter_backend` pode chamar), guarda cifrada no
  próprio banco (chave de decifragem no `ENV`), e chama a Asaas API **direto** nas compras —
  sem passar pelo proxy. Rotação: `asaas_payment` -> `devbutter_backend` (resolve `client_id`)
  -> webhook da loja -> atualiza chave cifrada.

## 4. Atribuições por API (como está hoje / alvo do ADR-0002)

| API | Responsabilidade |
|---|---|
| `asaas_payment` | Custódia única da `apiKey` real e das subcontas; mTLS; split; audit_logs; lifecycle da subconta |
| `selolibertaria/backend` | Orquestração de checkout, reconciliação de `Payment`, recebe webhook de pagamento direto da Asaas |
| `devbutter_backend` | Trigger de criação de subconta no fechamento do orçamento; guarda só referência (`AsaasSubaccountLink`, sem chave); dono de `quotes→orders→invoices` (fatura de serviço da própria DevButter) |

## 5. Em aberto

- Confirmar entendimento da proposta do item 3 (webhook + chave local cifrada) antes de
  comparar com o ADR-0002 — 3 perguntas ficaram pendentes (o que "asaas_api" referenciava,
  se a rotação transporta a chave em claro ou só um evento, e o mecanismo de auth do webhook
  da loja).
- Erro de sintaxe Mermaid reportado (`missing SD at '%% Fluxo NOVO (TO-BE)...'`) — aponta pra
  um `.mmd` existente no repo com um comentário `%%` antes da declaração do tipo de diagrama;
  ainda não localizado/corrigido.
- Decisão final: seguir com o Plano A (flag, retomando a migração pro proxy) ou considerar a
  proposta alternativa (chave local cifrada por loja) — nenhuma das duas foi fechada ainda.
