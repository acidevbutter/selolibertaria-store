# Mapa de migração para a API FastAPI

Atualizado em 2026-08-28. Mapa estático do código atual dos dois repositórios
(`selolibertaria-store` e `backend`); não substitui validação integrada.

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

Exceção ativa: cartões salvos do Mercado Pago estão **desabilitados** no Next
(`src/actions/checkout-actions.ts` devolve `savedCards: []` e recusa
`savedCardId`). Tema de issue própria; fora do escopo até tokenização e
contrato de cobrança/remoção existirem no FastAPI.

## Estado do backend (FastAPI)

Domínios em `backend/app/` ligados em `app/main.py`: `users`, `auth`,
`address`, `orders`, `payments`, `promotions`, `catalog`, `communications`,
`editorial`, `favorites`, `carts`, `checkout`, `settings`, `shipping`,
`webhooks`, `migrations`, `media`.

- PostgreSQL assíncrono (SQLAlchemy 2.0, Pydantic v2), 16 migrations Alembic.
  A execução contra PostgreSQL integrado e o smoke de registro/login continuam
  pendentes de evidência reproduzível.
- RBAC de operador em rotas administrativas (`admin`/`vendor`); chave interna
  para tráfego server-to-server.
- Migração única Mongo→PostgreSQL protegida por chave e reivindicada uma vez
  (`test_migrations.py`, ainda só em SQLite).

## Superfícies por domínio

| Domínio | Estado |
|---|---|
| Identidade | Registro, login, sessão JWT persistida, verificação, reset de senha e RBAC no FastAPI. OAuth está parcialmente migrado: o FastAPI controla state hash, PKCE, callback e ticket de uso único; o Next encaminha e troca o ticket pelo cookie. A matriz adversarial em `backend/tests/test_oauth.py` cobre os controles locais. O fluxo Instagram que exige coleta de e-mail ainda precisa ser conciliado com esse contrato antes do corte completo. Magic link não implementado. |
| Carrinho | Migrado. Carrinho convidado/autenticado, merge e itens validados pelo catálogo no FastAPI; Next consome `/carts`. |
| Catálogo | Migrado. Produtos, variantes, categorias e leitura pública/admin pelo FastAPI. |
| Checkout | Migrado no fluxo principal. Draft, comprador, entrega, pagamento Pix/cartão idempotente, finalização transacional e reconciliação no FastAPI. Snapshot/preço e cotação de frete são montados no Next antes do draft. |
| Pedidos | Migrado. CRUD, fulfillment forward-only, auditoria, dashboard e `POST /orders/{id}/payment-operation` (cancelamento/estorno via Orders API com guarda de estado e auditoria). |
| Mercado Pago | Implementação pausada por decisão de escopo. O núcleo existente inclui tentativa idempotente, validação/deduplicação de webhook e reconciliação, mas não deve avançar nem ser considerado pronto sem homologação Sandbox integrada. Cartões salvos seguem desabilitados. |
| Frete | Migrado. Cotação Melhor Envio no FastAPI (`/shipping/quote`); token e HTTP do provedor ficam no servidor. |
| Editorial | Migrado. Leitura pública e escrita admin pelo domínio `editorial` do FastAPI. |
| Promoções | Migrado. Promoções, cupons, elegibilidade, `price-cart` e resgate idempotente pelo FastAPI. |
| Comunicação | Migrado. E-mails transacionais, templates, retries, logs e webhooks admin pelo FastAPI/Butter Relay. |
| Mídia | Migrado. Upload/delete e newsletter pelo FastAPI; segredos Cloudinary ficam no servidor. |
| Endereço BR | Migrado. Lookup de CEP no FastAPI; browser não chama ViaCEP/BrasilAPI. |

## Rotas Mercado Pago que ainda existem no Next

Todas hoje são BFF fino sobre o FastAPI (nenhuma toca Mongo). Mantidas até a
homologação Sandbox integrada:

| Rota/módulo | Papel atual | Pré-requisito para remover |
|---|---|---|
| `POST /api/admin/mercado-pago/reconcile` | dispara `POST /checkout/reconcile` autenticado | prova do worker agendado no ambiente-alvo |
| `GET /api/cron/mercado-pago-reconciliation` | contingência de agendamento | evidência de execução periódica do worker Compose no ambiente-alvo |
| `src/actions/checkout-actions.ts` | monta snapshot e chama checkout/pagamento do FastAPI | mover montagem de snapshot/preço para o backend |
| `src/actions/mercado-pago-order-actions.ts` | consulta e finalização via FastAPI | — (encerra junto com a homologação Sandbox) |

Não há endpoint legado `/v1/payments` ativo. O fluxo é Mercado Pago Orders API.

## Pendências para GO (prompt 04)

Exigem ambiente integrado real e **não** podem ser fechadas com mock/SQLite/
render de Compose:

1. **Homologação Sandbox Mercado Pago** — Pix e cartão (sucesso, recusa,
   timeout, retry), URL pública de webhook com recibo duplicado, reconciliação
   após interrupção controlada. Bloqueada por falta de credencial Sandbox no
   ambiente. NO-GO até haver evidência reproduzível.
2. **Migração Mongo→PostgreSQL real** — `--dry-run`, execução real com
   relatório de contagens/inconsistências e segunda execução retornando 409.
   Bloqueada por falta de origem Mongo com dados.
3. **Agendamento do worker de reconciliação** no ambiente-alvo — hoje só há o
   serviço declarado no Compose.
4. **Smoke E2E no browser** contra a stack integrada (login, catálogo,
   carrinho, checkout, admin).
5. **Cartões salvos** — issue própria; permanecem indisponíveis.
