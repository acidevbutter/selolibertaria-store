# Mapeamento de Domínios, Rotas e Fluxos — Selo Libertária

> Gerado por leitura estática do código em `backend/` e `selolibertaria-store/` (checkouts
> principais, sem worktrees). Não cobre rotas/paths que só existem em branches não mergeadas
> (ex.: `feature/editorial-content-doc`). Revisado em 2026-09-24 contra o código atual do `main`
> de ambos os repositórios.

## 1. Visão geral

```
┌───────────────────────────┐        ┌──────────────────────────────┐
│  selolibertaria-store      │  HTTP  │  backend (FastAPI)            │
│  Next.js App Router         │ ─────► │  app.main:app                 │
│  - loja pública (App Router │  env:  │  routers sem prefixo global   │
│    grupo "(store)")         │  FASTAPI_API_URL                      │
│  - /admin (painel)          │        │  (cada domínio define seu     │
│  - Server Actions/Route     │        │   próprio prefixo, ex./auth)  │
│    Handlers chamando         │        └──────────────┬─────────────┘
│    `fastApiRequest`/fetch    │                       │
└───────────────────────────┘                       │
                                                       │ httpx (mTLS / API key)
                     ┌─────────────────────────────────┼───────────────────────────┐
                     ▼                                 ▼                           ▼
        ┌───────────────────────┐        ┌───────────────────────┐   ┌───────────────────────┐
        │ Asaas (payment proxy)  │        │ butter_blob            │   │ Melhor Envio / ViaCEP  │
        │ mTLS (cert.pem/ca.crt) │        │ API key (Bearer)       │   │ / BrasilAPI / OAuth    │
        │ backend/app/asaas/     │        │ backend/app/media/     │   │ providers (Google/     │
        │  proxy_client.py       │        │  service.py             │   │ Facebook/etc.)         │
        │  mirror_client.py      │        │                         │   │ shipping/service.py,   │
        │  direct_client.py      │        │                         │   │ address/service.py,    │
        │  (mtls.py)              │        │                         │   │ auth/oauth.py           │
        └───────────────────────┘        └───────────────────────┘   └───────────────────────┘
```

O backend não usa um prefixo global tipo `/api/v1`: `app/main.py` monta cada router direto na
raiz (`app.include_router(x_router)`), e cada domínio define seu próprio `prefix` dentro de
`APIRouter(prefix="/xxx", ...)`. Ou seja, os paths finais são `/{prefixo-do-domínio}/{rota}`
(ex.: `/checkout/intents`, `/auth/login`). Duas exceções de nomenclatura merecem nota:
- `payment_methods` monta em `/users/me/saved-cards` (não `/payment-methods`).
- `asaas` (payments_router e webhook_router) monta os dois em `/payments/asaas`.

Endpoints meta: `GET /health`, `GET /health/readiness` (sem prefixo, definidos direto em
`main.py`).

Autenticação usada nas rotas:
- **Bearer/sessão de usuário** — via `CurrentUser = Annotated[AuthUserRead, Depends(get_current_user)]`
  (`backend/app/auth/dependencies.py`), extraída de token de sessão.
- **Chave interna** (`X-Internal-Api-Key` == `settings.internal_api_key`) — protege rotas
  server-to-server chamadas pelo Next.js (ex.: `checkout`, `shipping/quote`,
  `communications/newsletter` parcialmente, `promotions/active`, `auth/internal/*`).
- **Público/sem auth** — rotas de leitura de catálogo publicado, settings públicas, presales
  públicas, editorial público, health checks.
- **Admin/operador** — dependências `require_*_operator`/`require_admin` que checam papel do
  usuário autenticado (ex. `require_catalog_operator`, `require_orders_operator`,
  `require_admin` em settings/site_activation).

---

## 2. Rotas por domínio (backend)

### 2.1 `auth` — prefixo `/auth` (`backend/app/auth/router.py`)

| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | `/auth/register` | Cria usuário + inicia sessão | pública |
| POST | `/auth/login` | Autentica e retorna sessão | pública |
| POST | `/auth/internal/session` | Emite sessão para uso interno (não aparece no schema) | interna |
| POST | `/auth/internal/oauth-user` | Resolve/gera usuário a partir de perfil OAuth | interna |
| POST | `/auth/internal/oauth/{provider}/exchange` | Troca code OAuth por token/perfil | interna |
| GET | `/auth/oauth/{provider}/start` | Inicia fluxo OAuth (retorna URL de autorização) | pública |
| GET | `/auth/oauth/{provider}/callback` | Callback do provider (redirect) | pública |
| POST | `/auth/oauth/complete` | Completa login OAuth, cria sessão | pública |
| POST | `/auth/internal/account-access` | Emite token de acesso a conta (interno) | interna |
| POST | `/auth/account-access/consume` | Consome token de acesso a conta | pública (token no corpo) |
| POST | `/auth/internal/password-token` | Emite token de reset de senha (interno) | interna |
| POST | `/auth/internal/checkout-user` | Resolve usuário durante checkout | interna |
| POST | `/auth/internal/users/{user_id}/revoke-sessions` | Revoga sessões de um usuário | interna |
| POST | `/auth/logout` | Revoga sessão atual | bearer |
| GET | `/auth/me` | Usuário autenticado atual | bearer |
| POST | `/auth/email-available` | Checa disponibilidade de e-mail | pública |
| POST | `/auth/verify` | Verifica e-mail | pública (token) |
| POST | `/auth/password-reset` | Solicita reset de senha | pública |
| POST | `/auth/password-reset/confirm` | Confirma novo password | pública (token) |
| POST | `/auth/password-reset/validate` | Valida token de reset | pública |
| POST | `/auth/verification/resend` | Reenvia verificação de e-mail | bearer |
| POST | `/auth/password-setup` | Define senha (ex.: conta criada via OAuth) | bearer |

### 2.2 `users` — prefixo `/users`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | `/users/` | Registrar usuário | pública |
| GET | `/users/` | Listar usuários | operador (`require_user_operator`) |
| GET | `/users/{user_id}` | Detalhe de usuário | operador |
| PATCH | `/users/{user_id}` | Atualizar perfil | bearer (próprio ou operador) |
| PATCH | `/users/{user_id}/role` | Alterar papel do usuário | operador/admin |
| PATCH | `/users/{user_id}/block` | Bloquear/desbloquear usuário | operador |

### 2.3 `payment_methods` — prefixo `/users/me/saved-cards`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| GET | `/users/me/saved-cards` | Listar cartões salvos do usuário | bearer |
| DELETE | `/users/me/saved-cards/{card_id}` | Remover cartão salvo | bearer |

### 2.4 `address` — prefixo `/address`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| GET | `/address/postal-lookup` | Busca endereço por CEP (proxy ViaCEP/BrasilAPI) | pública |

### 2.5 `catalog` — prefixo `/catalog`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| GET | `/catalog/categories/` | Listar categorias | pública |
| POST | `/catalog/categories/` | Criar categoria | operador |
| PATCH | `/catalog/categories/{slug}` | Renomear categoria | operador |
| POST | `/catalog/` | Criar produto | operador |
| POST | `/catalog/seed` | Seed de catálogo (dev/admin) | operador |
| GET | `/catalog/` | Listar produtos publicados (loja) | pública |
| GET | `/catalog/management/` | Listar todos os produtos (admin) | operador |
| GET | `/catalog/management/{slug}` | Detalhe admin por slug | operador |
| GET | `/catalog/id/{product_id}` | Detalhe por id | pública/interna |
| GET | `/catalog/variants/{variant_id}` | Detalhe de variante | pública/interna |
| GET | `/catalog/{slug}` | Produto publicado por slug (loja) | pública |
| PATCH | `/catalog/{slug}` | Atualizar produto | operador |
| DELETE | `/catalog/{slug}` | Remover produto | operador |
| POST | `/catalog/{slug}/variants` | Criar variante | operador |
| PATCH | `/catalog/{slug}/variants/{variant_id}` | Atualizar variante | operador |
| GET | `/catalog/{slug}/audit` | Histórico de auditoria do produto | operador |
| POST | `/catalog/{slug}/audit` | Registrar entrada de auditoria | operador |

### 2.6 `carts` — prefixo `/carts`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | `/carts/guest` | Criar carrinho de visitante | pública |
| GET | `/carts/guest/{cart_id}` | Obter carrinho de visitante | pública |
| POST | `/carts/guest/{cart_id}/items` | Adicionar item | pública |
| PUT | `/carts/guest/{cart_id}/items/{variant_id}` | Atualizar quantidade de item | pública |
| PUT | `/carts/guest/{cart_id}/coupon` | Aplicar/remover cupom | pública |
| DELETE | `/carts/guest/{cart_id}` | Limpar carrinho de visitante | pública |
| GET | `/carts/me` | Carrinho do usuário logado | bearer |
| POST | `/carts/me/items` | Adicionar item (usuário) | bearer |
| PUT | `/carts/me/items/{variant_id}` | Atualizar item (usuário) | bearer |
| PUT | `/carts/me/coupon` | Aplicar cupom (usuário) | bearer |
| DELETE | `/carts/me` | Limpar carrinho (usuário) | bearer |
| POST | `/carts/me/merge` | Fundir carrinho de visitante no carrinho do usuário (pós-login) | bearer |

### 2.7 `checkout` — prefixo `/checkout` (router inteiro exige `require_internal_api_key`)

| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | `/checkout/intents` | Criar checkout intent (order em rascunho) | interna |
| PATCH | `/checkout/intents/{order_id}` | Atualizar checkout intent | interna |
| POST | `/checkout/reconcile` | Reconciliar estado do checkout | interna |
| POST | `/checkout/intents/{order_id}/finalize` | Finalizar checkout (confirma pedido) | interna |
| POST | `/checkout/intents/{order_id}/save-card` | Salvar cartão usado no checkout | interna |

### 2.8 `payments/asaas` — checkout — `backend/app/asaas/payments_router.py`, prefixo `/payments/asaas`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | `/payments/asaas/customers` | Criar/garantir customer Asaas | interna (chamado do checkout) |
| POST | `/payments/asaas/charges` | Criar cobrança Asaas | interna |
| GET | `/payments/asaas/charges/{charge_id}` | Consultar cobrança | interna |

### 2.9 `payments/asaas` — webhook — `backend/app/asaas/webhook_router.py`, prefixo `/payments/asaas`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | `/payments/asaas/webhook` | Recebe notificações de pagamento do Asaas | token de acesso do webhook (`_validate_access_token`) |

### 2.10 `orders` — prefixo `/orders`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | `/orders/` | Criar pedido | interna/operador |
| POST | `/orders/drafts` | Criar rascunho de pedido | interna |
| GET | `/orders/drafts/{order_id}` | Obter rascunho | interna |
| PATCH | `/orders/drafts/{order_id}` | Atualizar rascunho | interna |
| GET | `/orders/{order_id}/audit` | Histórico de auditoria do pedido | operador |
| POST | `/orders/{order_id}/audit` | Registrar auditoria | operador |
| GET | `/orders/` | Listar pedidos (admin) | operador |
| GET | `/orders/dashboard` | Dados do dashboard admin | operador |
| GET | `/orders/me` | Pedidos do usuário logado | bearer |
| GET | `/orders/{order_id}` | Detalhe de pedido (admin) | operador |
| GET | `/orders/me/{order_id}` | Detalhe de pedido do próprio usuário | bearer |
| PATCH | `/orders/{order_id}/fulfillment` | Atualizar status de fulfillment | operador |
| POST | `/orders/{order_id}/payment-operation` | Registrar operação de pagamento (reembolso etc.) | operador |

### 2.11 `presales` — prefixo `/presales`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| GET | `/presales/public/product/{product_id}` | Pré-venda pública por produto | pública |
| POST | `/presales/` | Criar pré-venda | operador |
| GET | `/presales/` | Listar pré-vendas | operador |
| GET | `/presales/product/{product_id}` | Pré-venda por produto (admin) | operador |
| GET | `/presales/{presale_id}` | Detalhe | operador |
| PATCH | `/presales/{presale_id}` | Atualizar | operador |
| POST | `/presales/{presale_id}/publish` | Publicar | operador |
| POST | `/presales/{presale_id}/skip-setup` | Pular etapa de setup | operador |
| POST | `/presales/{presale_id}/close` | Encerrar pré-venda | operador |
| DELETE | `/presales/{presale_id}` | Remover | operador |
| GET | `/presales/{presale_id}/reservations` | Listar reservas da pré-venda | operador |

### 2.12 `promotions` — prefixo `/promotions`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| GET | `/promotions` | Listar promoções (usuário autenticado) | bearer |
| GET | `/promotions/active` | Promoções ativas (consumo interno, ex. precificação de carrinho) | interna |
| GET | `/promotions/internal/admin` | Listar (uso interno/admin) | interna |
| POST | `/promotions/price-cart` | Precificar carrinho com promoções | pública/interna |
| POST | `/promotions/redemptions` | Registrar resgate de promoção | interna |
| POST | `/promotions/internal/admin/{promotion_id}/favorite-alerts/queue` | Enfileirar alertas de favoritos | interna |
| POST | `/promotions/internal/admin/favorite-alerts/dispatch` | Disparar alertas de favoritos | interna |
| GET | `/promotions/coupon/{code}` | Consultar cupom por código | pública |
| POST | `/promotions` | Criar promoção | bearer/operador |
| POST | `/promotions/internal/admin` | Criar (interno) | interna |
| PATCH | `/promotions/{promotion_id}/status` | Atualizar status | bearer/operador |
| PATCH | `/promotions/internal/admin/{promotion_id}/status` | Atualizar status (interno) | interna |
| PUT | `/promotions/{promotion_id}` | Atualizar promoção | bearer/operador |
| PUT | `/promotions/internal/admin/{promotion_id}` | Atualizar (interno) | interna |

> Nota: `promotions` expõe rotas duplicadas em variante pública/bearer e variante
> `/internal/admin/...` equivalente — provável padrão de "uso pelo painel via Next.js" (interno)
> vs. "uso direto por cliente autenticado".

### 2.13 `favorites` — prefixo `/favorites`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| GET | `/favorites/me` | Listar favoritos do usuário | bearer |
| POST | `/favorites/toggle` | Alternar favorito | bearer |

### 2.14 `editorial` — prefixo `/editorial`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| GET | `/editorial/public/{content_type}` | Listar conteúdo publicado por tipo | pública |
| GET | `/editorial/public/{content_type}/{slug}` | Conteúdo publicado específico | pública |
| GET | `/editorial/internal/admin/{content_type}` | Listar (admin) | interna |
| PUT | `/editorial/internal/admin` | Reordenar/gravar em lote (admin) | interna |
| PUT | `/editorial/internal/admin/{content_type}/{slug}/draft` | Salvar rascunho | interna |
| POST | `/editorial/internal/admin/{content_type}/{slug}/publish` | Publicar | interna |
| POST | `/editorial/internal/admin/{content_type}/{slug}/revert` | Reverter para versão publicada | interna |
| DELETE | `/editorial/internal/admin/{content_type}/{slug}` | Remover | interna |
| GET | `/editorial/{content_type}` | Fallback/leitura direta por tipo | pública/interna |

### 2.15 `media` — prefixo `/media`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | `/media/internal/admin/upload` | Upload de mídia (proxy para butter_blob) | interna |
| POST | `/media/internal/admin/delete` | Remover mídia | interna |
| GET | `/media/internal/admin` | Listar mídia (biblioteca) | interna |
| GET | `/media/internal/admin/{asset_id}/crops` | Listar crops de um asset | interna |
| PUT | `/media/internal/admin/{asset_id}/crops/{aspect}` | Definir crop por aspect ratio | interna |
| GET | `/media/internal/render/{asset_id}` | Servir/renderizar asset (proxy) | pública (usada em `<img>`) |
| PUT | `/media/internal/admin/usage` | Atualizar referências de uso do asset | interna |
| GET | `/media/internal/admin/{asset_id}/usage` | Consultar uso do asset | interna |

### 2.16 `communications` — prefixo `/communications`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | `/communications/newsletter` | Inscrever e-mail na newsletter | pública |
| POST | `/communications/send` | Disparar comunicação transacional | interna |
| GET | `/communications` | Listar comunicações (histórico) | operador |
| POST | `/communications/{communication_id}/retry` | Reprocessar envio com falha | operador |

### 2.17 `shipping` — prefixo `/shipping`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | `/shipping/quote` | Cotar frete (proxy Melhor Envio) | interna |

### 2.18 `settings` — prefixo `/settings`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| GET | `/settings/public` | Configurações públicas da loja | pública |
| GET | `/settings/` | Configurações completas (admin) | operador/admin |
| PATCH | `/settings/` | Atualizar configurações | admin |

### 2.19 `site_activation` — prefixo `/site-activation`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| GET | `/site-activation/public` | Status público de ativação do site | pública |
| GET | `/site-activation/` | Status (admin) | admin |
| POST | `/site-activation/activate` | Ativar site | admin |
| POST | `/site-activation/deactivate` | Desativar site | admin |

### 2.20 `webhooks` — prefixo `/webhooks`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| GET | `/webhooks` | Listar eventos de webhook recebidos (painel admin) | operador |

### 2.21 `migrations` — prefixo `/admin/migrations`

| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | `/admin/migrations/mongo-to-postgres` | Rodar migração pontual Mongo→Postgres | interna/admin |

### 2.22 Meta

| Método | Path | Descrição |
|---|---|---|
| GET | `/health` | Liveness |
| GET | `/health/readiness` | Readiness |

---

## 3. Microsserviços/integrações externas consumidas pelo backend

| Serviço | Propósito | Endpoints consumidos | Auth | Onde no código |
|---|---|---|---|---|
| **Asaas (payment proxy mTLS)** | Cobranças, clientes e reembolsos de pagamento | `POST {base}/customers`, cobranças e reembolsos via paths internos do proxy (ver `proxy_client.py`); mirror via `mirror_client.py` faz `POST` genérico com `path`/`body` | mTLS (`cert=`, `verify=` via `mtls_options()` em `backend/app/asaas/mtls.py`), base em `settings.asaas_payment_base_url` | `backend/app/asaas/proxy_client.py`, `backend/app/asaas/mirror_client.py` |
| **Asaas (direct/legacy)** | Modo direto com API key real de subconta (marcado como stopgap ADR-0002) | Idêntico ao proxy, mas contra `settings.asaas_direct_base_url` | Header `apiKey` = `settings.asaas_api_key` | `backend/app/asaas/direct_client.py:42,139,196` |
| **butter_blob** | Storage de blob/imagem — upload, leitura de asset por URL pública | `POST /internal/v1/blobs` (upload multipart) | Bearer/API key (`BUTTER_BLOB_SERVICE_API_KEY`), base em `settings.butter_blob_base_url` | `backend/app/media/service.py:29-118` (`get_butter_blob_client`, upload em linha 110); fetch de asset já público via `_get_fetch_client()` (linha 61,193) |
| **Melhor Envio** | Cotação de frete | `POST {base_url}/api/v2/me/shipment/calculate` | Token configurado via settings da loja (`shippingEnabled`/config armazenada) | `backend/app/shipping/service.py:44-61` |
| **ViaCEP** | Lookup de endereço por CEP (fallback 1) | `GET https://viacep.com.br/ws/{cep}/json/` | sem auth | `backend/app/address/service.py:37` |
| **BrasilAPI** | Lookup de endereço por CEP (fallback 2) | `GET https://brasilapi.com.br/api/cep/v2/{cep}` | sem auth | `backend/app/address/service.py:55` |
| **Provedores OAuth (Google/Facebook/outro terceiro)** | Login social | `POST` token endpoint + `GET` profile endpoint por provider, client id/secret vêm de `store_settings.current["oauthProviders"]` | client_id/client_secret armazenados em settings da loja | `backend/app/auth/oauth.py:153-244` |
| **butter_relay (Celery/Redis)** | Envio de e-mails transacionais (verificação, reset de senha, notificações de pedido, newsletter) | `celery.send_task("butter_relay.process_message", ...)` na fila `settings.relay_queue_name`, broker Redis (`settings.redis_url`) — sem HTTP direto, é fire-and-forget num broker compartilhado com o worker do `butter_relay` | credencial implícita via `settings.relay_project_id` + broker Redis | `backend/app/core/clients/relay_client.py`, consumido por `backend/app/communications/service.py` (`_dispatch`) |

---

## 4. Fluxos ponta a ponta (happy paths)

### 4.1 Autenticação (signup → login → sessão)
1. Front: formulário de cadastro (`selolibertaria-store/src/lib/auth.ts` / `auth-login.ts`) →
   `POST /auth/register` → backend cria usuário, retorna `AuthSessionRead`.
2. Front grava sessão (cookie) via `src/lib/session.ts`.
3. Chamadas subsequentes autenticadas usam `GET /auth/me` para validar sessão corrente.
4. Fluxo OAuth: `GET /auth/oauth/{provider}/start` → redireciona ao provider → callback do
   provider → `GET /auth/oauth/{provider}/callback` (backend) ou rota Next `route.ts` que chama
   `POST /auth/internal/oauth/{provider}/exchange` e depois `POST /auth/internal/oauth-user` →
   `POST /auth/oauth/complete` para emitir sessão.
5. Logout: `POST /auth/logout`.

### 4.2 Catálogo (list → detail → favoritar)
1. Front: `(store)/products/page.tsx` e `(store)/category/[slug]/page.tsx` → `commerce-fastapi.ts`
   → `catalog.ts` → `GET /catalog/` (listagem publicada, com filtro de categoria/paginação).
2. Front: `(store)/product/[slug]/page.tsx` → `GET /catalog/{slug}`.
3. Usuário logado favorita: `POST /favorites/toggle`; lista de favoritos: `GET /favorites/me`.

### 4.3 Checkout completo (cart → shipping → payment → confirmação)
1. Carrinho: visitante usa `POST /carts/guest`, `POST /carts/guest/{cart_id}/items`,
   `PUT /carts/guest/{cart_id}/coupon`; usuário logado usa os equivalentes `/carts/me/*`. Ao logar,
   front chama `POST /carts/me/merge` para unir o carrinho de visitante.
2. Frete: `checkout-quote-context.tsx`/`checkout-form.client.tsx` chamam (via server
   action/route) `POST /shipping/quote` (interno, usa `address/postal-lookup` antes para
   validar CEP).
3. Criação do checkout intent: `src/actions/checkout-actions.ts` → `fastApiRequest("/checkout/intents", ...)`
   → backend cria `Order` em rascunho e, internamente, dispara `POST /payments/asaas/customers`
   e `POST /payments/asaas/charges` (via `asaas/proxy_client.py`, mTLS) para gerar a cobrança.
4. Formulário de pagamento (`asaas-checkout-form.client.tsx`) coleta dados de cartão/pix/boleto
   conforme o charge criado.
5. Confirmação: `PATCH /checkout/intents/{order_id}` (atualizações) e
   `POST /checkout/intents/{order_id}/finalize` → pedido confirmado. O backend expõe
   `POST /checkout/intents/{order_id}/save-card` para gravar cartão em `/users/me/saved-cards`,
   mas **nenhum caminho do frontend atual chama esse endpoint nem lista/remove cartões salvos**
   (ver observação na seção 6) — o fluxo de cartão salvo está pronto no backend, não plugado no
   Next.
6. Assíncrono: Asaas notifica status via `POST /payments/asaas/webhook`; backend atualiza o
   pedido e dispara comunicações (`communications/send`) e e-mails de status
   (`src/lib/order-status-notification.ts`).
7. Página `checkout/processing` consulta status do pedido via `GET /orders/me/{purchaseId}` ou
   `GET /orders/{purchaseId}` até confirmação.

### 4.4 Pedidos do usuário (pós-compra)
1. `(store)/orders/page.tsx` → `GET /orders/me` (paginado).
2. Detalhe → `GET /orders/me/{order_id}`.

### 4.5 Pré-venda (presales)
1. Página pública de pré-venda (`(store)/pre-venda/little-fish-big-fish/page.tsx`) →
   `GET /presales/public/product/{productId}`.
2. Admin cria/gerencia via `/admin/pre-venda` → `POST /presales/`, `GET /presales/`,
   `PATCH /presales/{id}`, `POST /presales/{id}/publish`, `.../skip-setup`, `.../close`,
   `GET /presales/{id}/reservations`.

### 4.6 Editorial/blog (contentDoc)
1. Público: páginas de conteúdo (about, events, sarau-safado, etc.) chamam
   `GET /editorial/public/{content_type}` / `GET /editorial/public/{content_type}/{slug}`.
2. Admin (`/admin/editorial/*`, editor de blocos — fatia 02) cobre os content types `home`, `about`,
   `contact`, `events`, `projects`, `sarau-safado`, `global`, `pagina-do-produto` e `products`
   (novo: `admin/editorial/products/page.tsx`, copy estrutural da vitrine de produtos, distinto de
   `pagina-do-produto` que é a PDP individual): `GET /editorial/internal/admin/{content_type}`
   para listar, `PUT /editorial/internal/admin/{type}/{slug}/draft` para salvar rascunho,
   `POST /editorial/internal/admin/{type}/{slug}/publish` para publicar,
   `POST /editorial/internal/admin/{type}/{slug}/revert` para reverter,
   `DELETE /editorial/internal/admin/{type}/{slug}` para remover, e
   `PUT /editorial/internal/admin` para operações em lote/reorder (`blocks-actions.ts`,
   `page-content-actions.ts`).

### 4.7 Admin — media library (fatia 01)
1. `/admin/media` → `GET /media/internal/admin?{query}` (listar), upload via
   `POST /media/internal/admin/upload` (que por sua vez chama `POST {butter_blob}/internal/v1/blobs`),
   `POST /media/internal/admin/delete`, crops via `GET/PUT /media/internal/admin/{id}/crops[/{aspect}]`,
   e uso do asset via `GET/PUT /media/internal/admin/{id}/usage` (para saber onde a imagem está
   referenciada antes de deletar). Renderização de imagem no front usa
   `GET /media/internal/render/{asset_id}`.

### 4.8 Admin — pedidos, usuários, promoções, webhooks, settings
- Pedidos: `/admin/orders` → `GET /orders/` (lista), `GET /orders/dashboard`, `GET /orders/{id}`,
  `PATCH /orders/{id}/fulfillment`, `POST /orders/{id}/payment-operation`,
  `GET/POST /orders/{id}/audit`.
- Usuários: `/admin/users` → `GET /users/`, `GET /users/{id}`, `PATCH /users/{id}`,
  `PATCH /users/{id}/role`, `PATCH /users/{id}/block`.
- Promoções: `/admin/promotions` → `GET/POST /promotions` (+ variantes `/internal/admin/...`),
  `PATCH/PUT` de status e edição.
- Webhooks (visualização de eventos recebidos): `/admin/webhooks` → `GET /webhooks?...`.
- Settings: `/admin/settings` → `GET /settings/`, `PATCH /settings/`, além de
  `/site-activation` para ativar/desativar a loja.
- Operação Asaas (cancelamento/estorno/reconciliação manual): rotas Next `api/admin/asaas/payment-operation`
  e `api/admin/asaas/reconcile` fazem proxy fino para `POST /orders/{id}/payment-operation` e
  `POST /checkout/reconcile` respectivamente.
- Newsletter/e-mails: `/admin/emails`, `/admin/email-templates` → `GET /communications`,
  `POST /communications/{id}/retry`, `POST /communications/send`.

---

## 5. Frontend — rotas do App Router e correspondência com o backend

Base: `selolibertaria-store/src/app/`. Uso do backend é quase sempre via helper
`fastApiRequest`/`apiFetch` que monta `${env.FASTAPI_API_URL}${path}` (definido em vários
arquivos de `src/lib/*.ts`, cada um dono de um subconjunto de domínio) e por Server
Actions em `src/actions/*.ts`.

### 5.1 Loja pública (grupo `(store)`)

| Página | Endpoints backend consumidos |
|---|---|
| `(store)/page.tsx` (home) | `GET /editorial/public/home` (conteúdo), `GET /catalog/` (destaques), `GET /settings/public` |
| `(store)/products/page.tsx` | `GET /catalog/` |
| `(store)/category/[slug]/page.tsx` | `GET /catalog/categories/`, `GET /catalog/` (filtrado) |
| `(store)/product/[slug]/page.tsx` | `GET /catalog/{slug}`, `GET /presales/public/product/{id}` (se aplicável), `GET /promotions/coupon/{code}` / `POST /promotions/price-cart` (preço promocional) |
| `(store)/search/page.tsx` | `GET /catalog/` (busca client-side sobre listagem, ver `src/lib/search/*`) |
| `(store)/pre-venda/little-fish-big-fish/page.tsx` | `GET /presales/public/product/{id}` |
| `(store)/orders/page.tsx` | `GET /orders/me` |
| `checkout/page.tsx`, `checkout-form.client.tsx`, `asaas-checkout-form.client.tsx` | `POST /carts/me/merge`, `PUT /carts/*/coupon`, `POST /shipping/quote`, `POST /checkout/intents`, `PATCH /checkout/intents/{id}`, `POST /checkout/intents/{id}/finalize`, `POST /checkout/intents/{id}/save-card` |
| `checkout/prepare/route.ts` | monta snapshot do carrinho (`src/lib/checkout/cart-snapshot.ts`) antes de criar o intent |
| `checkout/return/route.ts`, `checkout/processing/*` | `GET /orders/me/{id}` (poll de status) |
| `login/`, `reset-password/` | `POST /auth/login`, `POST /auth/password-reset`, `POST /auth/password-reset/confirm`, `POST /auth/password-reset/validate` |
| `account/access/route.ts` | `POST /auth/account-access/consume` |
| `user/*` (perfil) | `GET /auth/me`, `PATCH /users/{id}`, `GET /orders/me`, `GET /favorites/me` |
| `about/`, `contact/`, `events/`, `faq/`, `privacy/`, `terms/`, `projects/`, `sarau-safado/` | `GET /editorial/public/{content_type}[/{slug}]` |
| Newsletter (rodapé, `src/ui/footer/actions.ts`) | `POST /communications/newsletter` |

### 5.2 Painel `/admin`

| Página | Endpoints backend consumidos |
|---|---|
| `admin/page.tsx` (dashboard) | `GET /orders/dashboard` |
| `admin/orders/*` | `GET /orders/`, `GET /orders/{id}`, `PATCH /orders/{id}/fulfillment`, `POST /orders/{id}/payment-operation`, `GET/POST /orders/{id}/audit` |
| `admin/products/*` | `GET /catalog/management/`, `GET /catalog/management/{slug}`, `POST /catalog/`, `PATCH /catalog/{slug}`, `DELETE /catalog/{slug}`, `POST/PATCH /catalog/{slug}/variants[/{id}]`, `GET/POST /catalog/{slug}/audit`, `GET/POST /catalog/categories/`, `PATCH /catalog/categories/{slug}` |
| `admin/pre-venda/*` | `GET/POST /presales/`, `GET/PATCH /presales/{id}`, `POST /presales/{id}/publish|skip-setup|close`, `GET /presales/{id}/reservations` |
| `admin/promotions/*` | `GET/POST /promotions` (+ `/internal/admin` variantes), `PATCH/PUT /promotions/{id}[/status]` |
| `admin/media/*` | `GET /media/internal/admin`, `POST /media/internal/admin/upload|delete`, `GET/PUT /media/internal/admin/{id}/crops[/{aspect}]`, `GET/PUT /media/internal/admin/{id}/usage`, `GET /media/internal/render/{id}` |
| `admin/editorial/*` (inclui `blocos`, `home`, `about`, `contact`, `events`, `projects`, `sarau-safado`, `global`, `pagina-do-produto`, `products`) | `GET /editorial/internal/admin/{type}`, `PUT /editorial/internal/admin/{type}/{slug}/draft`, `POST /editorial/internal/admin/{type}/{slug}/publish|revert`, `DELETE /editorial/internal/admin/{type}/{slug}`, `PUT /editorial/internal/admin` (batch/reorder) |
| `admin/users/*` | `GET /users/`, `GET /users/{id}`, `PATCH /users/{id}[/role|/block]` |
| `admin/webhooks/*` | `GET /webhooks` |
| `admin/settings/*` | `GET /settings/`, `PATCH /settings/`, `GET/POST /site-activation/*`, `admin-oauth-providers.client.tsx` grava providers OAuth dentro de settings |
| `admin/emails/*`, `admin/email-templates/*` | `GET /communications`, `POST /communications/{id}/retry`, `POST /communications/send` |

---

## 6. Observações e possíveis bugs encontrados (não corrigidos — reportar via issue)

Durante a leitura, um ponto chamou atenção e vale investigar com mais profundidade antes de
abrir issue (não foi possível confirmar com 100% de certeza só por leitura estática, sem rodar
o servidor/testes):

- **`promotions` tem rotas duplicadas com e sem `/internal/admin`** fazendo praticamente a mesma
  coisa (`GET /promotions` vs `GET /promotions/internal/admin`; `POST /promotions` vs
  `POST /promotions/internal/admin`; `PATCH .../status` vs `PATCH /internal/admin/.../status`;
  `PUT /promotions/{id}` vs `PUT /internal/admin/{id}`) — `backend/app/promotions/router.py`.
  Não é necessariamente um bug (pode ser um padrão intencional: rota "pública/bearer" para uso
  direto pelo usuário final vs. rota "interna" para o admin/Next.js), mas é uma duplicação de
  superfície de API que vale confirmar com o Marcos se é proposital ou dívida técnica antes de
  registrar como bug.
- Não foi encontrada nenhuma chamada no frontend para `GET /catalog/id/{product_id}` nem para
  `GET /catalog/variants/{variant_id}` — endpoints existem no backend mas não têm consumidor
  visível em `selolibertaria-store/src` (podem ser usados só internamente entre serviços, ou
  podem estar órfãos). Vale confirmar antes de decidir se é dívida técnica.
- **Todo o domínio `payment_methods` (cartões salvos) e o endpoint `POST /checkout/intents/{order_id}/save-card`
  parecem órfãos no frontend atual.** Buscas por `savedCard`, `saved-cards` e `save-card` em
  `selolibertaria-store/src` não encontraram nenhuma chamada real a `GET/DELETE /users/me/saved-cards`
  nem a `POST /checkout/intents/{order_id}/save-card`; `src/actions/checkout-actions.ts` não tem
  mais lógica de `savedCards` (isso já era esperado com Mercado Pago/cartões desabilitados — ver
  `fastapi-migration-map.md` — mas os endpoints Asaas equivalentes também não foram religados após
  a migração para Asaas). Backend pronto, front não plugado — confirmar com o Marcos se é
  intencional (feature pausada) ou esquecimento antes de abrir issue.

Nenhuma rota chamada pelo frontend ficou "sem par" no backend (toda chamada com prefixo
`FASTAPI_API_URL` encontrada em `src/lib`/`src/actions` bateu com um router existente). Não há,
portanto, um bug confirmado de "rota quebrada" para abrir issue nesta rodada — os pontos acima são
observações de possível dívida/duplicação/feature não conectada, não falhas confirmadas.
