# Mapa de migração para a API FastAPI

Atualizado em 2026-08-24. Estado verificado no código atual.

## Regra de destino

O Next.js deve ficar como camada de apresentação/BFF: sessão de browser, cookies, renderização, validação de entrada e proxy para a API. Persistência, regras de negócio, integrações externas e jobs devem ficar no FastAPI.

O Next.js não deve importar `mongodb`, `getDb`, `ensureIndexes` ou manter `MONGODB_URI`/`MONGODB_DB_NAME` quando todas as áreas abaixo tiverem contrato equivalente no FastAPI.

## Estado atual do FastAPI

Já existe em `backend/app/`:

- `users`: cadastro, listagem, leitura, perfil, papel e bloqueio;
- `auth`: cadastro, login, sessão JWT persistida, verificação e reset de senha;
- `orders`: criação, listagem, leitura e fulfillment;
- `catalog`: produtos, variantes, publicação e auditoria;
- `carts`: carrinhos de convidado/autenticados, merge e itens validados pelo catálogo;
- migração única Mongo→PostgreSQL;
- PostgreSQL assíncrono, SQLAlchemy, Alembic, paginação e logs de requisição.

Essas rotas ainda são contratos de referência. O proxy do Next.js, autenticação e autorização de serviço ainda não estão conectados.

## O que precisa entrar no FastAPI

| Domínio | Escopo necessário | Estado |
|---|---|---|
| Identidade | login, registro, verificação, recuperação, OAuth, sessões, magic link e RBAC | Parcial; `auth` existe no FastAPI, mas Next.js ainda usa Mongo/JWT local e faltam OAuth, magic link e RBAC |
| Carrinho | carrinho convidado/autenticado, merge e snapshot imutável de checkout | Parcial; domínio e migração de `users.cart` existem no FastAPI, mas o Next.js ainda usa Mongo/cookies |
| Checkout | comprador, endereço BR, frete, cupons, draft e finalização idempotente | Pendente; hoje em Server Actions/Mongo |
| Pedidos | itens, status de pagamento, fulfillment, auditoria, notificações e consulta administrativa | Parcial; CRUD e fulfillment existem, mas falta autorização e integração |
| Catálogo | produtos, variantes, categorias, leitura pública e administração | Parcial; domínio existe no FastAPI, mas o storefront ainda lê Mongo |
| Mercado Pago | Orders API, Pix/cartão, customer cards, webhook, reconciliação, cancelamento e estorno | Parcial; assinatura do webhook está no FastAPI, mas o ciclo de pagamento continua no Next.js |
| Frete | Melhor Envio, cotação, seleção do menor serviço e snapshot | Pendente; hoje no Next.js |
| Editorial | home, páginas, eventos, projetos, Sarau Safado e mídia | Pendente; permanece no Next.js/Mongo |
| Promoções | promoções, cupons, elegibilidade, resgate e alertas | Pendente; permanece no Next.js/Mongo |
| Comunicação | emails, templates, retries, logs e webhooks administrativos | Pendente; permanece no Next.js/Mongo |

## Resquícios Mongo no Next.js

Ainda existem conexões diretas em rotas e módulos de:

- usuários e autenticação;
- conta e sessões;
- pedidos, checkout e carrinho;
- catálogo e categorias;
- promoções e favoritos;
- editorial, configurações, emails e webhooks;
- upload/auditoria e notificações.

Por isso, não é correto remover `MONGODB_URI`, `MONGODB_DB_NAME` ou `src/lib/mongodb.ts` nesta etapa. A remoção só pode ocorrer depois que os contratos acima estiverem implementados, o proxy estiver ativo e os testes de cutover passarem.

## Rotas Mercado Pago no frontend

| Rota/módulo | Uso atual | Pode remover agora? | Pré-requisito |
|---|---|---:|---|
| `POST /api/mercado-pago/webhook` | valida assinatura e sincroniza pedido no Mongo | Não | validação existe em `POST /payments/mercado-pago/webhook`; faltam idempotência e finalização PostgreSQL |
| `POST /api/admin/orders/[id]/payment` | cancelamento e estorno via Orders API + atualização/auditoria Mongo | Não | operações `cancel/refund` e auditoria no domínio `orders` do FastAPI |
| `POST /api/admin/mercado-pago/reconcile` | reconciliação manual de pedidos pendentes | Não | worker/serviço de reconciliação no FastAPI e endpoint administrativo autenticado |
| `GET /api/cron/mercado-pago-reconciliation` | job protegido para reconciliação automática | Não | scheduler/worker FastAPI, lock, retry/backoff e alerta persistido em PostgreSQL |
| `src/actions/checkout-actions.ts` | criação do draft, Pix/cartão, idempotência e customer cards | Não | checkout e integração Mercado Pago completos no FastAPI |
| `src/actions/mercado-pago-order-actions.ts` | consulta do pedido, finalização, conta e pedido local | Não | serviço de finalização transacional no FastAPI |
| `src/lib/mercado-pago.ts` | customer cards e assinatura do webhook | Não | customer cards e assinatura movidos para o FastAPI |

Não foi encontrado endpoint legado `/v1/payments` ativo no código atual. O fluxo ativo é Mercado Pago Orders API.

## Critério para retirar Mongo do frontend

1. Implementar o contrato no FastAPI e testes de domínio.
2. Adicionar autenticação serviço-a-serviço e autorização por papel.
3. Criar o client server-only do FastAPI no Next.js.
4. Trocar uma superfície por vez para proxy, preservando o contrato público.
5. Validar leitura, escrita, idempotência, erros e reload direto.
6. Executar cutover controlado e confirmar ausência de `mongodb`, `getDb` e `ensureIndexes` em `src/app/api`, `src/actions` e módulos usados por essas rotas.
7. Só então remover `MONGODB_URI`, `MONGODB_DB_NAME`, dependência `mongodb` e `src/lib/mongodb.ts` do frontend. As variáveis Mongo do script de migração devem permanecer apenas no ambiente operacional do backend até o encerramento da migração.
