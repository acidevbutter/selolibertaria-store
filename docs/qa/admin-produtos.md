# Runbook QA — Fluxo feliz: Admin · Produtos (criar livro)

- Data do teste: 2026-09-08
- Ambiente: local, logado como admin (`contato@selolibertaria.com.br`)

## Passo a passo testado

1. `/admin/orders` → carrega ok, lista vazia (esperado, nenhum pedido concluído neste ambiente).
2. `/admin/products` → carrega ok, mostra o catálogo atual (1 livro seedado).
3. `/admin/products/new` → formulário de criação carrega ok.
4. Preencher: Nome "QA Teste Livro", Categoria "Livros", Estoque 5, Tipo "book", Formato "print", Descrição, Variante "Capa flexível", Preço "39,90" → clicar "Criar livro".

## Bug #5 (crítico) — Falha ao registrar auditoria derruba a página inteira, mesmo com o produto criado com sucesso — ✅ CORRIGIDO (2026-09-08)

- **Observado**: ao clicar "Criar livro", a tela inteira vira "Ooops, algo deu errado! / Tentar novamente" (error boundary genérico). Do ponto de vista do admin, **parece que a criação falhou**.
- **Realidade confirmada via API**: o produto **foi criado normalmente** — `GET /catalog/` já lista `qa-teste-livro` ao lado do produto seedado. Ou seja, a operação principal teve sucesso, mas a UI reporta uma falha total.
- **Causa raiz confirmada no backend** (`backend/app/catalog/router.py:209`, função `create_product_audit`): o log de auditoria do produto (uma chamada secundária, pós-criação) quebra com:
  ```
  pydantic_core._pydantic_core.ValidationError: 1 validation error for ProductAuditRead
  id
    Input should be a valid string [type=string_type, input_value=UUID('...'), input_type=UUID]
  ```
  O campo `id` do model `ProductAuditRead` está tipado como `str`, mas o valor vindo do banco é um `UUID` — Pydantic v2 não faz a coerção automática. Isso derruba o endpoint com 500, que por sua vez faz a Server Action do Next.js lançar `"Não foi possível registrar a auditoria do produto."` sem tratamento, propagando até o error boundary global.
- **Impacto**: qualquer criação de produto (e provavelmente edição/exclusão, se usarem a mesma auditoria) aciona esse crash. Risco real de duplicidade: um admin vendo a tela de erro tende a tentar de novo, achando que nada foi salvo, e pode acabar criando o mesmo produto duas vezes.
- **Correção sugerida**: no backend, ajustar `ProductAuditRead.id` para aceitar `UUID` (ou serializar para `str` antes de `model_validate`, ex. `str(row.id)`); no frontend, tratar a falha de auditoria como não-bloqueante (log e seguir), já que é um efeito colateral e não deveria derrubar a operação principal que já teve sucesso.
- **Correção aplicada**: em `backend/app/catalog/schemas.py`, o campo `ProductAuditRead.id` passou a usar `Annotated[str, BeforeValidator(str)]` (alias `UuidAsStr`), que aceita tanto `UUID` quanto `str` e sempre serializa como string — sem precisar mudar a coluna do banco (`ProductAuditLog.id`, que é `UUID` de propósito, diferente de `CatalogProduct`/`CatalogVariant`, que usam slugs como PK). Testado direto no endpoint: `POST /catalog/{slug}/audit` agora responde `201` com `id` como string, em vez de `500`. Não alteramos o frontend para tornar a auditoria "não-bloqueante" — a causa raiz já resolve o problema, e manter o erro visível (agora sem crashar) preserva o sinal caso a auditoria falhe por outro motivo no futuro.

## Editorial · Página inicial — smoke test rápido (OK)

- `/admin/editorial/home` carrega o formulário completo (5 blocos: abertura, manifesto, produto, catálogo, programação).
- "Salvar página inicial" → `POST /admin/editorial/home → 200 OK`, sem erro. Diferente do bug de produtos, o salvamento editorial não aciona nenhuma auditoria quebrada.

## Não testado ainda (por tempo)
- Edição de produto existente, exclusão, upload de imagem.
- Categorias (`/admin/products/categories`).
- Promoções, Pré-venda, Usuários, E-mails, Configurações, Webhooks, Modelos de e-mail.
- Demais páginas de Editorial (about, contact, events, projects, sarau-safado, global, pagina-do-produto) — só "Página inicial" foi verificada.
