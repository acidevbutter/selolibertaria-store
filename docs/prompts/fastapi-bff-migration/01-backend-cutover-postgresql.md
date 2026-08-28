# Prompt 01 — backend: cutover PostgreSQL e autoridade FastAPI

Leia `00-governanca-e-contrato.md` antes de começar. Trabalhe somente em
`/Users/marcospereira/development/selolibertaria/backend`.

## Objetivo

Tornar o FastAPI operacional como fonte de verdade, preservando MongoDB apenas
durante a migração única.

## Escopo

1. Revisar todos os modelos e migrations Alembic dos domínios registrados em
   `app/main.py`.
2. Corrigir constraints, índices, timestamps, relacionamentos, idempotência e
   transações necessárias para carrinho, checkout, pedidos e pagamentos.
3. Proteger `POST /admin/migrations/mongo-to-postgres` com autenticação de
   operador ou segredo operacional fora do browser.
4. Executar primeiro `--dry-run`, depois a migração real em ambiente controlado,
   com relatório de contagens, inconsistências, falhas e rollback.
5. Validar que a aplicação normal não depende de MongoDB após o cutover.
6. Implementar ou deixar explicitamente bloqueados cartões salvos, reconciliação
   agendada e qualquer operação Mercado Pago sem prova integrada.

## Regras de implementação

- Usar SQLAlchemy async, Pydantic v2, Alembic e a estrutura
  `router/schemas/models/service/repository` existente.
- Routers finos; regra no service; SQL somente no repository.
- Não usar `os.environ` diretamente fora de settings.
- Não logar token, cartão, senha, assinatura ou payload sensível.
- Não remover o código de migração antes da validação e do snapshot de origem.
- Não criar fallback silencioso para Mongo.

## Critérios de aceite

- `alembic upgrade head` executa no PostgreSQL alvo.
- Migração real é protegida, reivindicada uma única vez e produz relatório
  verificável.
- Segunda execução retorna conflito sem duplicar dados.
- Auth, catálogo, carrinho, checkout, pedido, webhook e admin funcionam contra
  PostgreSQL.
- RBAC cobre admin, vendor, usuário e chamadas internas.
- Testes de domínio e contrato passam; testes que usam SQLite/mocks são
  identificados como unitários, não como prova de produção.
- Compose, `.env.example`, README e deploy refletem as dependências reais.

## Saída

Entregue arquivos alterados, comandos executados, evidências, contagens da
migração e bloqueios restantes. Não faça alterações no frontend neste prompt.
