# Mapa de migração para a API FastAPI

Atualizado em 2026-09-24. Mapa estático do código atual dos dois repositórios
(`selolibertaria-store` e `backend`); não substitui validação integrada.

> Nota: a versão anterior deste documento (2026-08-28) descrevia o provedor de pagamento como
> "Mercado Pago". O provedor em produção é **Asaas** (via `asaas_payment`, proxy mTLS) — Mercado
> Pago não existe mais em nenhum lugar do código (`backend/app/asaas/*`,
> `docs/prompts/asaas-payment-proxy-internal/*`). Esta revisão substitui todas as referências.

## Regra de destino

O Next.js fica como camada de apresentação/BFF: sessão de browser, cookies,
renderização, validação de entrada e proxy para a API. Persistência, regras de
negócio, integrações externas e jobs ficam no FastAPI.

## Estado do frontend (Next.js)

Maior parte das superfícies foi movida para o FastAPI. A revisão estática
identificou:

- `src/` não contém `mongodb`, `getDb`, `ensureIndexes`, `MongoClient` nem
  `src/lib/mongodb.ts`;
- `.env`/`.env.example` não têm `MONGODB_URI` nem `MONGODB_DB_NAME`;
- as rotas migradas consomem o FastAPI por client server-only
  (`FASTAPI_API_URL` + `FASTAPI_INTERNAL_API_KEY`), com `cache: no-store` e
  tradução de erro na borda.

Exceção ativa: **cartões salvos parecem desconectados do front**, embora o backend já tenha o
contrato pronto (domínio `payment_methods`, `GET/DELETE /users/me/saved-cards`, e
`POST /checkout/intents/{order_id}/save-card`). Não há nenhuma chamada a esses endpoints em
`selolibertaria-store/src` hoje (nem em `src/actions/checkout-actions.ts`, que não referencia mais
`savedCards`). Precisa confirmação com o Marcos se é feature pausada intencionalmente ou
dívida deixada da migração Mercado Pago → Asaas antes de considerar "pronto".

## Estado do backend (FastAPI)

Domínios em `backend/app/` ligados em `app/main.py` (ordem de `include_router`): `users`, `auth`,
`address`, `orders`, `promotions`, `catalog`, `communications`, `editorial`, `favorites`,
`carts`, `checkout`, `payment_methods`, `presales`, `settings`, `shipping`, `site_activation`,
`webhooks`, `asaas` (`payments_router` + `webhook_router`, ambos em `/payments/asaas`),
`migrations`, `media`.

`payments` e `notifications` existem como pacotes em `backend/app/` mas **não têm router HTTP** —
são módulos internos (`payments/models.py`+`repository.py` para a tabela `payment`;
`notifications/service.py` para envio pontual), consumidos por outros domínios, não expostos
diretamente.

- PostgreSQL assíncrono (SQLAlchemy 2.0, Pydantic v2), migrations via Alembic.
- RBAC de operador em rotas administrativas (`admin`/`vendor`); chave interna
  (`X-Internal-Api-Key`) para tráfego server-to-server (checkout inteiro, `promotions/active`,
  boa parte de `editorial`/`media`, `auth/internal/*`).
- Migração única Mongo→PostgreSQL protegida por chave e reivindicada uma vez
  (`test_migrations.py`). A rota `/admin/migrations/mongo-to-postgres` fica
  dormente a menos que `MIGRATIONS_ENABLED=true`. As tabelas de origem incluem, por herança
  histórica do fork Mercado Pago, `mercado_pago_reconciliation`/`mercado_pago_payment_attempts`
  em `orders/models.py` — usadas só pelo importador da migração legada
  (`backend/app/migrations/mongo_source.py`), não pelo fluxo de checkout Asaas atual.

## Superfícies por domínio

| Domínio | Estado |
|---|---|
| Identidade | Registro, login, sessão persistida, verificação, reset de senha e RBAC no FastAPI. OAuth: FastAPI controla state hash, PKCE, callback e ticket de uso único (`/auth/oauth/{provider}/start|callback`, `/auth/oauth/complete`); o Next encaminha e troca o ticket pelo cookie. Magic link não implementado. |
| Carrinho | Migrado. Carrinho convidado/autenticado, merge e itens validados pelo catálogo no FastAPI; Next consome `/carts`. |
| Catálogo | Migrado. Produtos, variantes, categorias, seed idempotente (`POST /catalog/seed`) e leitura pública/admin pelo FastAPI. |
| Checkout | Migrado no fluxo principal. Draft (`/checkout/intents`), finalização, reconciliação (`/checkout/reconcile`) e `save-card` no FastAPI; router inteiro atrás de chave interna. Snapshot/preço e cotação de frete são montados no Next antes do draft. |
| Pedidos | Migrado. CRUD, fulfillment, auditoria, dashboard e `POST /orders/{id}/payment-operation` (cancelamento/estorno, com guarda de estado e auditoria). |
| **Pagamentos (Asaas)** | Migrado, modo padrão `proxy`: todo tráfego para o provedor passa por `asaas_payment` sobre mTLS (`AsaasProxyClient`, `backend/app/asaas/proxy_client.py`), sem que este processo guarde a apiKey real. Existe um modo `direct` (`AsaasDirectClient`) ligado por `settings.asaas_checkout_mode == "direct"` — stopgap temporário do ADR-0002 (`docs/prompts/asaas-payment-proxy-internal/06-adr-ponte-temporaria-modo-direto.md`), não o caminho padrão de produção. Webhook (`POST /payments/asaas/webhook`) valida token de acesso e reconcilia `payment`/`order`. |
| Cartões salvos | Contrato pronto no backend (`payment_methods`, `/users/me/saved-cards`, `checkout/intents/{id}/save-card`) mas **sem consumidor no Next hoje** — ver seção "Estado do frontend" acima. |
| Pré-venda | Novo desde a última revisão. Migrado: CRUD, publish/skip-setup/close, reservas, leitura pública por produto (`/presales/*`) no FastAPI; usado pela página `little-fish-big-fish` e por `/admin/pre-venda`. |
| Ativação do site | Novo desde a última revisão. `site_activation` (`/site-activation/*`) permite ativar/desativar a loja publicamente via admin. |
| Frete | Migrado. Cotação Melhor Envio no FastAPI (`/shipping/quote`); token e HTTP do provedor ficam no servidor. |
| Editorial | Migrado, contentDoc estruturado (11 tipos de node). Leitura pública e escrita admin pelo domínio `editorial`; `src/lib/editorial-admin-api.ts` chama `PUT .../draft`, `POST .../publish`, `POST .../revert`, `DELETE`, `PUT /editorial/internal/admin` (batch/reorder). Cobre 9 content types incluindo o novo `products` (copy da vitrine, distinto de `pagina-do-produto`). |
| Promoções | Migrado. Promoções, cupons, elegibilidade, `price-cart` e resgate idempotente pelo FastAPI. Superfície duplicada intencional: rota "pública/bearer" (`/promotions`) e rota espelho `/promotions/internal/admin` para uso interno/painel — ver `docs/mapeamento-dominios-rotas.md` §2.12. |
| Comunicação | Migrado. E-mails transacionais, templates, retries, logs pelo FastAPI; envio real delega para o **butter_relay** via Celery/Redis (`backend/app/core/clients/relay_client.py`), não é mais SQS. |
| Mídia | Migrado. Upload/delete/crop/usage proxy para **butter_blob** (não Cloudinary — `backend/app/media/service.py`); segredos ficam no servidor. |
| Endereço BR | Migrado. Lookup de CEP no FastAPI (ViaCEP + fallback BrasilAPI); browser não chama os provedores diretamente. |

## Rotas Asaas que existem no Next (BFF fino sobre o FastAPI)

Substituem as antigas rotas "Mercado Pago" do Next (removidas — não há mais
`src/actions/mercado-pago-order-actions.ts` nem `/api/cron/mercado-pago-reconciliation`):

| Rota/módulo | Papel atual |
|---|---|
| `POST /api/admin/asaas/reconcile` | dispara `POST /checkout/reconcile` autenticado (admin) |
| `POST /api/admin/asaas/payment-operation` | dispara `POST /orders/{id}/payment-operation` (cancelar/estornar) |
| `src/actions/checkout-actions.ts` | monta snapshot e chama checkout/pagamento do FastAPI |

Não há endpoint legado `/v1/payments` nem qualquer rota Mercado Pago ativa. O fluxo é 100% Asaas
via `asaas_payment` (proxy mTLS por padrão).

## Pendências conhecidas

Itens que exigem ambiente integrado real e não podem ser fechados só com leitura estática:

1. **Cartões salvos** — decidir se `payment_methods`/`save-card` é religado ao Next ou permanece
   pausado; hoje é código morto do ponto de vista do usuário final.
2. **Migração Mongo→PostgreSQL real** — segue restrita a `--dry-run`/SQLite nos testes; falta
   origem Mongo com dados reais para uma execução real com relatório de contagens.
3. **Modo `direct` do Asaas (ADR-0002)** — confirmar se o stopgap ainda está ativo em produção ou
   se já pode ser revertido para `proxy` puro (ver plano no ADR referenciado acima).
4. **Smoke E2E no browser** contra a stack integrada (login, catálogo, carrinho, checkout, admin,
   pré-venda).
