# Teste integrado no browser — selolibertaria-store

Data: 2026-09-05 · Escopo: **loja/site público (admin excluído nesta fase)**
Ambiente: store `http://localhost:3001` (`yarn dev`, Next 16.2.4) · backend FastAPI `http://localhost:9001` (docker `selolibertaria-backend-api`, healthy) · Postgres via backend.

> Observação de método: parte do teste foi feita por navegação real no browser e parte por
> requisições diretas (curl) + leitura dos logs do dev server, porque o browser ficou preso
> no bug **BUG-1** (abaixo) e não há como limpar o cookie `yns_cart_id` (httpOnly) pelas ferramentas.

---

## 🔴 Bloqueadores (derrubam a loja inteira)

### BUG-1 — Cookie de carrinho de convidado "órfão" derruba TODAS as rotas
- **Sintoma:** toda rota do site (`/`, `/about`, `/login`, `/checkout`, …) renderiza
  "Algo deu errado / Não foi possível recuperar o carrinho". HTTP ainda é 200/307, mas o
  corpo é o error boundary global.
- **Causa raiz:** `RootLayout` (`src/app/layout.tsx:49`) chama `getCartAction()` **sem try/catch**.
  Quando o cookie `yns_cart_id` aponta para um carrinho que o backend não tem mais **e** o
  cookie carrega linhas de item cujas variantes não existem mais:
  1. `GET /carts/guest/{id}` → 404
  2. `getGuest()` cai em `createGuestFromCookie()` (há itens no cookie)
  3. `POST /carts/guest` → 201 (novo carrinho)
  4. `POST /carts/guest/{novo}/items` → **404 "Variante de produto não disponível"**
  5. `cart-actions.ts:109` faz `throw new Error("Não foi possível recuperar o carrinho")`
  6. erro sobe até `RootLayout` → aplicação inteira em erro
- **Gatilho no mundo real:** reset/limpeza do catálogo, expiração/TTL do carrinho no backend,
  troca de banco — qualquer coisa que invalide um carrinho de convidado já persistido no navegador.
- **Recuperação para o usuário final:** só limpando cookies manualmente. Não há auto-heal.
- **Reproduzível por:**
  `curl -s localhost:3001/api/cart -H 'Cookie: yns_cart_id=%7B%22id%22%3A%22deadbeef-0000-4000-8000-000000000abc%22%2C%22items%22%3A%5B%7B%22productId%22%3A%22...%22%2C%22variantId%22%3A%22...%22%2C%22quantity%22%3A1%7D%5D%7D'`
  → `500 {"error":"Failed to load cart","code":"CART_LOAD_FAILED"}`
- **Sugestão (não aplicada):** `getCartAction` deve capturar falha de ressurreição do carrinho,
  chamar `clearCartId()` e retornar `null`; e/ou `createGuestFromCookie` ignorar item 404 em vez de `throw`.

---

## 🟠 Bugs funcionais

### BUG-2 — `/api/auth/email-available` bloqueado pelo middleware (401) para visitante
- `src/ui/auth/register-form.client.tsx:83` chama `/api/auth/email-available` durante o cadastro.
- `src/proxy.ts` `isPublicApiPath()` **não inclui** essa rota → visitante recebe `401 Unauthorized`.
- Efeito: verificação de e-mail disponível quebra no formulário de cadastro (usuário deslogado).
- Rotas públicas de auth listadas hoje: `login`, `login/form`, `verify`, `register`,
  `forgot-password`, `reset-password`, `oauth/*`. Falta `email-available`.

### BUG-3 — Admin/seed não loga (nenhuma credencial conhecida funciona)
- `.env`: `ADMIN_EMAIL=contact@selolibertaria.com` / `ADMIN_PASSWORD=<REDACTED>`.
- `POST localhost:9001/auth/login` com essas credenciais → **401 "Credenciais inválidas"**.
- `POST localhost:3001/api/auth/login` idem → 401.
- O seed de admin não foi aplicado neste Postgres (ou a senha divergiu). Cadastro novo via
  `/auth/register` funciona (201), então o fluxo de auth em si está de pé — falta o seed.

### BUG-4 — Página de categoria inexistente não tem estado "não encontrado"
- `/category/qualquer-coisa` e `/category/ninfas-do-tiete` → **200 só com header/footer**, miolo em branco.
- Comparar com `/product/x` que mostra corretamente "Produto não encontrado".
- Backend: `/catalog/categories/` = `[]`; slug de categoria → 404. A página deveria renderizar
  um not-found, não uma página vazia.

---

## 🟡 Menores / UX / observações

- **`/checkout` com carrinho vazio** mostra `h1` = **"Erro no checkout"** + "Empty cart".
  É o caminho de carrinho simplesmente vazio; título com "Erro" soa como falha, não estado normal.
- **`/api/health` (store) → 401** (barrado pelo middleware; não está em `isPublicApiPath`).
  Probes de uptime/health externas falhariam.
- **GitHub OAuth não configurado:** `/api/auth/oauth/github/start` → redirect
  `…/login?oauth_error=provider`. Google OAuth OK (307 → backend). Esperado em dev, registrado.
- **Sem dados de comércio semeados:** `catalog` = 0 itens, `catalog/categories` = `[]`,
  `editorial/public/event` = `[]`. Só o conteúdo editorial (home, sobre, projetos, sarau, etc.)
  tem dados. Não dá para testar PDP real, carrinho com item, cupom, frete, checkout pago.

---

## 🟢 O que passou (sessão limpa / visitante, via SSR)

| Rota | Status | Conteúdo |
|---|---|---|
| `/` | 200 | Hero "Ninfas do Tietê" + manifesto renderizam |
| `/products` | 200 | "A loja do selo" + empty-state ("em breve") |
| `/search?q=couro` | 200 | 'Procurando por "couro"' |
| `/about` `/projects` `/events` `/sarau-safado` | 200 | editorial OK |
| `/contact` `/faq` `/privacy` `/terms` | 200 | páginas institucionais OK |
| `/login` `/reset-password` | 200 | formulários renderizam |
| `/product/{slug inválido}` | 200 | "Produto não encontrado" (graceful) |
| `/orders` `/user` | 307 → `/login` | auth gate do middleware OK |
| `/sitemap.xml` `/robots.txt` | 200 | OK |
| `POST /api/auth/register` (store) | 201 | `{"pending":true}` (verificação por e-mail) |
| `POST /api/auth/login` (usuário recém-criado) | 200 | login processa |
| `GET /api/address/postal-lookup?country=BR&postalCode=01001000` | 200 | "Praça da Sé", SP — OK |
| `/api/auth/oauth/google/start` | 307 → backend | OK |
| backend `/health` | 200 | `{"status":"ok"}` |
| backend `/settings/public` | 200 | OK |

---

## Não testável nesta rodada
- Interação client-side real no browser (carrinho, drawer, cupom, checkout Mercado Pago,
  favoritos, edição de perfil) — bloqueado por **BUG-1** + catálogo vazio.
- Fluxo de compra ponta a ponta (precisa de produto/variante semeados e login funcional).
- Admin (fora de escopo por instrução).
