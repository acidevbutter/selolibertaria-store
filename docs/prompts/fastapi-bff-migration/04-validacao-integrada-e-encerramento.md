# Prompt 04 — validação integrada e encerramento

Leia todos os prompts anteriores. Não declare a migração concluída sem todas as
provas abaixo.

## Matriz mínima

| Fluxo | Prova obrigatória |
|---|---|
| Login/sessão/RBAC | FastAPI + PostgreSQL + cookies do Next |
| Catálogo/carrinho | leitura, escrita, merge e reload |
| Checkout | snapshot, preço, frete, idempotência e finalização |
| Mercado Pago | Sandbox, webhook, reconciliação, cancelamento/estorno |
| OAuth | state/PKCE/callback e vinculação |
| Admin | usuários, pedidos, editorial, promoções, mídia, comunicações |
| Migração | dry-run, execução real, contagens e segunda execução protegida |
| Operação | health, readiness, logs sanitizados, timeout e rollback |

## Procedimento

1. Subir a stack com PostgreSQL e dependências reais.
2. Aplicar migrations e executar a migração controlada.
3. Rodar testes backend e frontend.
4. Executar smoke tests HTTP autenticados.
5. Executar o fluxo completo no browser contra FastAPI.
6. Verificar ausência de Mongo ativo no frontend e ausência de dependência
   Mongo na aplicação após o cutover.
7. Revisar documentação, variáveis, Compose, deploy e rollback.

## Critério final GO

Só marcar GO se todos os fluxos críticos passarem no ambiente integrado, sem
mockar PostgreSQL, provider, Relay ou autenticação. Caso algo falhe, registrar
NO-GO com fato observado, risco, comando/evidência e próximo bloqueio.

## Entrega

Atualizar changelog e histórico, preservar commits separados de frontend e
backend, informar hashes reais e não criar tag/release sem autorização
explícita.
