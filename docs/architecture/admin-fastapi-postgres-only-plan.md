# Plano — Admin consumindo 100% PostgreSQL via FastAPI

Objetivo declarado: **todo e qualquer consumo de dados do admin passa pelo
backend FastAPI; o MongoDB só é acessado pelo backend (e apenas para a
migração).**

Atualizado em 2026-09-01. Complementa `fastapi-migration-map.md`.

## Status de execução

| Fatia | Estado |
|---|---|
| 1 — Backend: contrato do domínio `editorial` | **Concluída.** `upsert` calcula ordem/rename; novos `POST /editorial/internal/admin/{type}/reorder` e `PATCH /editorial/internal/admin/{type}/{slug}/publish`; `tests/test_editorial.py` (7 casos). |
| 2 — Frontend: remover o shim | **Concluída.** `src/lib/editorial-api-store.ts` deletado; novo `src/lib/editorial-admin-api.ts` (funções tipadas); `src/app/admin/editorial/actions.ts` reescrito; `grep -E "collection\(|\$set|bulkWrite"` em `src` → zero. |
| 3 — Backend: Mongo opcional/desligável | **Parcial.** Rota `/admin/migrations/*` agora dorme em `404` sem `MIGRATIONS_ENABLED=true` (`app/migrations/router.py`, `settings.migrations_enabled`, README). **Falta:** mover `motor` para extra opcional do Poetry e adiar o import em `app/db/mongo.py`. |
| 4 — Migração real Mongo→PostgreSQL | **Pendente.** Bloqueada por origem Mongo com dados (blocker nº 2 do `fastapi-migration-map.md`). |
| 5 — Regressão e docs | Testes `backend` (85) e `store` (139) verdes; `tsc`/`ruff` limpos; `mypy` sem regressão. Smoke E2E manual do admin ainda pendente. |

---

## 1. Diagnóstico do estado atual

### 1.1 O frontend admin já **não** fala com o Mongo

Varredura estática de `selolibertaria-store/src`:

- Não existe driver `mongodb`/`mongoose` em `package.json`, nem
  `MongoClient`, `getDb`, `src/lib/mongodb.ts`.
- `env.mjs` não tem `MONGODB_URI`/`MONGODB_DB_NAME`. As únicas variáveis de
  dados são `FASTAPI_API_URL` + `FASTAPI_INTERNAL_API_KEY`.
- Todas as páginas e server actions de `src/app/admin/**` e as rotas
  `src/app/api/admin/**` chamam `${env.FASTAPI_API_URL}/...` com
  `cache: "no-store"`:
  - Pedidos → `/orders`, `/orders/{id}`, `/orders/dashboard`,
    `/orders/{id}/payment-operation`, `/orders/{id}/fulfillment`, `/orders/{id}/audit`
  - Usuários → `/users`, `/users/{id}`
  - Catálogo/produtos → `src/lib/catalog.ts`, `src/lib/product-categories.ts`,
    `src/lib/product-audit.ts` → `/catalog/...`
  - Promoções → `src/lib/promotions.ts` → `/promotions/...`
  - Editorial → `src/lib/editorial-content-store.ts` → `/editorial/...`
  - Settings → `src/lib/settings-store.ts`, `src/app/api/admin/settings` → `/settings/...`
  - Comunicações/e-mails → `/communications/...`
  - Webhooks → `/webhooks`
  - Mídia → `/media/internal/admin/...`
  - Dashboard → `src/lib/admin-dashboard.ts` → `/orders/dashboard`

**Conclusão:** no nível de código, a premissa "admin lê o Mongo direto" já não
se sustenta. O que resta são resíduos de acoplamento e itens de encerramento,
detalhados abaixo.

### 1.2 O backend ainda carrega o Mongo — só para a migração

`backend/app/db/mongo.py` documenta-se como "the app's only sanctioned Mongo
access point". Uso real de `motor` hoje:

- `app/migrations/router.py` / `service.py` / `mongo_source.py` — rota de
  cutover única, protegida por chave e reivindicável uma vez.
- `app/core/dependencies.py` expõe `MongoDb` — consumido **apenas** por
  `app/migrations/router.py`.
- `scripts/migrate_mongo_to_postgres.py` — gêmeo CLI dev/staging.
- Dependências: `motor` (prod) e `mongomock-motor` (dev) em `pyproject.toml`;
  settings `mongodb_uri` / `mongodb_db_name`.

Nenhum outro domínio (`users`, `orders`, `catalog`, `editorial`, `promotions`,
`settings`, `carts`, `checkout`, `favorites`, `communications`, `webhooks`,
`payments`, `shipping`, `media`) importa `motor`. Todos têm modelo SQLAlchemy
2.0 + repositório + migration Alembic (17 revisões).

### 1.3 Resíduos reais a eliminar

| # | Resíduo | Arquivo(s) | Por que importa |
|---|---|---|---|
| R1 | Shim "com cara de Mongo" | `src/lib/editorial-api-store.ts` — expõe `.collection().find().sort().toArray()`, `updateOne`, `bulkWrite`, `$set`, `_id` | É a superfície que "parece Mongo". Regras de negócio (upsert por slug, troca de slug = delete+rewrite, **reordenação de eventos/projetos**) vivem no server action `src/app/admin/editorial/actions.ts`, não no backend. A reordenação faz N+1 chamadas HTTP através do shim. |
| R2 | Montagem de documento editorial no BFF | `src/app/admin/editorial/actions.ts`, `src/app/admin/editorial/page-content-actions.ts` | O Next monta o objeto `content` inteiro, calcula `order`, `createdAt/By`, resolve troca de slug. O backend só faz `PUT` cego. Deveria ser lógica de serviço no domínio `editorial`. |
| R3 | Sem endpoint de reordenação no backend | `backend/app/editorial/router.py` (só tem `GET`, `PUT`, `DELETE`) | Obriga o R1 a existir. |
| R4 | Mongo ainda montado em produção no backend | `app/main.py:52` inclui `migrations_router`; `motor` sempre importável | Enquanto a rota `/migrations/*` existir ligada, "Mongo só pelo backend" continua sendo "Mongo ligado por padrão". |
| R5 | Montagem de snapshot/preço de checkout no BFF | `src/actions/checkout-actions.ts` | Fora do escopo "admin", mas é o mesmo padrão (regra de negócio no Next). Listado para rastreio, não para esta entrega. |
| R6 | Cartões salvos Mercado Pago desabilitados | `src/actions/checkout-actions.ts` | Issue própria; não bloqueia este plano. |

---

## 2. Objetivo de destino (Definition of Done)

1. `selolibertaria-store` não tem nenhuma abstração com forma de banco
   (`collection`, `find`, `$set`, `_id`, `bulkWrite`). O admin só conhece
   funções de domínio tipadas (`listEditorialEvents`, `reorderEditorialItem`,
   ...) que fazem `fetch` ao FastAPI.
2. Toda regra de negócio de escrita (ordenação, timestamps, autor, troca de
   slug, validação de payload) mora em `backend/app/<dominio>/service.py`.
3. O backend expõe endpoint para cada operação que o admin precisa — sem
   "PUT cego" que delega a modelagem ao cliente.
4. `motor` deixa de ser dependência de runtime do backend: fica atrás de um
   extra opcional / feature flag, com a rota `/migrations/*` desligada por
   padrão após o cutover real.
5. Contrato validado: suíte de testes do domínio `editorial` cobre reordenação
   e troca de slug no backend; testes do admin no Next passam a mockar as
   funções de domínio (não um `getDb`).

---

## 3. Plano em fatias

### Fatia 1 — Backend: fechar o contrato do domínio `editorial`

**Escopo:** mover para `app/editorial/service.py` tudo que hoje o Next monta.

- [ ] `EditorialService.upsert` passa a: gerar `slug` (via util própria),
      preencher `order` (próximo disponível quando ausente), `created_at/by` e
      `updated_at/by` a partir do `actor_id`, e recusar payload inválido com
      `422` (hoje o erro é string genérica no Next).
- [ ] Novo endpoint `POST /editorial/internal/admin/{content_type}/reorder`
      recebendo `{ slug, direction: "up" | "down" }` **ou**
      `{ ordered_slugs: [...] }`. Implementa a troca de `order` em uma única
      transação (substitui o `bulkWrite` do shim).
- [ ] `DELETE` já existe; garantir que troca de slug seja atômica no serviço
      (`rename(old_slug, new_slug)`), não delete+put a partir do cliente.
- [ ] Testes: `backend/tests/test_editorial.py` — reordenação (topo, meio,
      base, slug inexistente), troca de slug preserva `created_at`, upsert
      sem `order` calcula o próximo.
- [ ] Migration Alembic **não** necessária (schema `editorial_content` já tem
      `order`, `slug`, timestamps — confirmar em
      `alembic/versions/20260824_1700_add_editorial_content.py`).

### Fatia 2 — Frontend: substituir o shim por cliente de domínio

**Escopo:** deletar `src/lib/editorial-api-store.ts`.

- [ ] Criar `src/lib/editorial-admin-api.ts` com funções tipadas:
      `listEditorialAdmin(type)`, `upsertEditorial(payload)`,
      `deleteEditorial(type, slug)`, `reorderEditorial(type, slug, direction)`.
      Cada uma é um `fetch` fino ao FastAPI com tradução de erro na borda
      (padrão já usado em `product-categories.ts`).
- [ ] Reescrever `src/app/admin/editorial/actions.ts`:
  - `moveEditorialItem` → uma chamada a `reorderEditorial(...)`.
  - `create*/update*` → montar só o `content` visual do formulário e delegar
    `order`/timestamps/slug ao backend (deixar de enviar `createdAt`,
    `updatedBy` calculados aqui; enviar só `X-Actor-User-ID`).
  - Remover `const COLLECTION = "editorialContent"` e todo uso de `getDb()`.
- [ ] `page-content-actions.ts`: `upsertPageRecord` continua um `PUT`, mas
      para de calcular `createdAt/By`; backend assume.
- [ ] Atualizar `src/app/admin/editorial/actions.test.ts` para mockar
      `@/lib/editorial-admin-api` (funções), não `getEditorialApiStore`.
- [ ] `grep -rE "collection\(|\\$set|bulkWrite|_id" src` → zero ocorrências.

### Fatia 3 — Backend: tornar o Mongo opcional e desligável

**Escopo:** "Mongo só pelo backend" vira "Mongo só quando a migração roda".

- [ ] `pyproject.toml`: mover `motor` para um grupo/extra opcional
      (`poetry ... --extras migration` ou grupo `migration`). `mongomock-motor`
      permanece em `dev`.
- [ ] `app/db/mongo.py` e `app/core/dependencies.py:MongoDb`: import de `motor`
      adiado para dentro da função (já é lazy no client; falta no
      `dependencies.py`), com erro claro se o extra não estiver instalado.
- [ ] `app/main.py`: incluir `migrations_router` só quando
      `settings.migrations_enabled` (novo, default `False`) for verdadeiro.
- [ ] `settings/config.py`: `migrations_enabled: bool = False`; documentar que
      `mongodb_uri`/`mongodb_db_name` só são lidos nesse modo.
- [ ] README do backend: seção "Executar a migração Mongo→PostgreSQL" com o
      passo `--extras migration` + `MIGRATIONS_ENABLED=true`.

### Fatia 4 — Executar a migração real e congelar o Mongo

Depende de origem Mongo com dados (bloqueio nº 2 do `fastapi-migration-map.md`).

- [ ] `scripts/migrate_mongo_to_postgres.py --dry-run` com relatório de
      contagens por coleção.
- [ ] Execução real; segunda execução retorna `409` (idempotência já testada
      em `test_migrations.py`).
- [ ] Conferência de contagens PostgreSQL vs relatório.
- [ ] Após aceite: `MIGRATIONS_ENABLED` volta a `False` no ambiente-alvo;
      credencial Mongo revogada/removida do secret store.

### Fatia 5 — Varredura de regressão e documentação

- [ ] Smoke E2E do admin contra a stack integrada: login operador, listar/editar
      pedido, editar usuário, CRUD de produto+categoria, CRUD editorial +
      **reordenar**, salvar settings, ver webhooks/e-mails.
- [ ] `rg -n "FASTAPI_API_URL" src/app/admin src/app/api/admin src/lib` — todo
      acesso a dados do admin bate nessa constante e em nada mais.
- [ ] Atualizar `docs/architecture/fastapi-migration-map.md`: editorial deixa de
      ter "escrita admin monta documento no Next"; registrar Mongo como extra
      opcional desligado.
- [ ] Remover este plano ou marcá-lo como concluído.

---

## 4. Ordem de execução e dependências

```
Fatia 1 (backend editorial) ──▶ Fatia 2 (frontend shim) ──▶ Fatia 5 (regressão)
Fatia 3 (mongo opcional) ───────────────────────────────▶ Fatia 5
Fatia 4 (migração real) ── depende de dados Mongo ──────▶ Fatia 5
```

Fatias 1+2 e Fatia 3 são independentes e podem correr em paralelo. Fatia 4 é a
única bloqueada por ambiente (não fechável com mock/SQLite).

## 5. Riscos

- **Reordenação editorial**: o shim ordena por `order` asc + `updatedAt` desc.
  O endpoint novo precisa reproduzir o mesmo tie-break para não embaralhar
  listas existentes.
- **Troca de slug**: hoje é delete+put no cliente; se o `PUT` falhar depois do
  `DELETE`, o item some. Mover para transação de serviço remove essa janela —
  é um ganho, mas exige teste explícito de rollback.
- **`order` ausente em registros legados**: a migração deve preencher `order`
  determinístico (ex.: pela ordem de criação) para a reordenação funcionar.
- **Feature flag da rota de migração**: desligar `migrations_router` sem quebrar
  `test_migrations.py` — os testes devem forçar `migrations_enabled=True`.
