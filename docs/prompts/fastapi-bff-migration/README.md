# Prompts coordenados — migração Next.js BFF → FastAPI

Use estes prompts em ordem. Eles foram escritos para serem entregues ao Claude
um por vez, mantendo o mesmo contrato entre o checkout Next.js e o backend
FastAPI.

## Ordem obrigatória

1. `00-governanca-e-contrato.md`
2. `01-backend-cutover-postgresql.md`
3. `02-frontend-bff-cutover.md`
4. `03-oauth-jobs-e-mercado-pago.md`
5. `04-validacao-integrada-e-encerramento.md`

Não iniciar o prompt seguinte enquanto os critérios do anterior não estiverem
comprovados. Backend e frontend continuam versionados separadamente.

## Estado de partida verificado

- Frontend: `/Users/marcospereira/development/selolibertaria/selolibertaria-store`.
- Backend: `/Users/marcospereira/development/selolibertaria/backend`.
- O backend possui domínios FastAPI para auth, usuários, catálogo, carrinhos,
  checkout, pedidos, pagamentos, promoções, editorial, comunicações, mídia,
  frete, favoritos, settings e webhooks.
- O frontend já consome muitos desses contratos e não possui import direto de
  MongoDB em `src/`.
- MongoDB ainda existe no backend exclusivamente como fonte da migração e no
  Compose; PostgreSQL ainda precisa de cutover comprovado.
- OAuth ainda mantém `state`, PKCE e callback na borda Next.
- Cartões salvos e validação integrada Mercado Pago continuam pendentes.

## Regra de sincronização

Toda mudança de contrato deve ser feita em três partes:

1. schema/endpoint FastAPI e teste de domínio;
2. consumidor server-only do Next/BFF e teste de contrato;
3. validação integrada com PostgreSQL e dependências reais disponíveis.

Não alterar `asaas_payment`, não mover segredos para o browser e não declarar
GO com base apenas em SQLite, mocks, `docker compose config` ou build local.
