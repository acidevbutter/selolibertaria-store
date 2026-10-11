# 04 — Remover o caminho `relay-credential`

**Repositórios alvo:** `asaas_payment`, `devbutter_backend`, `selolibertaria/backend`.

## Pré-requisitos obrigatórios

- Fase `02` e `03` verdes em testes.
- Sandbox E2E do proxy concluído com evidência.
- Busca em todos os três repositórios sem consumidores ativos de `relay-credential`,
  `DEVBUTTER_SELOLIBERTARIA_RELAY_HMAC_SECRET`, `AsaasCredentialStore` ou
  `asaas_subaccount_credential` no caminho novo.
- Aprovação explícita antes de qualquer migração destrutiva ou revogação de segredo.

## Ordem segura

1. Desabilitar o relay por feature/configuração somente no sandbox e comprovar que o checkout proxy segue operante.
2. Remover o cliente/rotas HMAC de relay e rotação entre DevButter e Selo.
3. Remover `POST /subaccounts/{id}/relay-credential`, `RELAY_CLIENT_CNS`, schemas,
   testes e documentação correlata do `asaas_payment`.
4. Migrar e excluir cópias de credenciais no banco da Selo somente com a aprovação acima;
   nunca logar conteúdo e nunca apagar banco inteiro.
5. Revogar somente credenciais explicitamente identificadas como obsoletas, após readback.

## Critérios de aceite

- Nenhuma resposta HTTP fora do `asaas_payment` contém `apiKey`.
- Nenhuma credencial Asaas permanece armazenada na Selo.
- A criação, consulta, evento e rotação são executadas pelo proxy.
- Há rollback documentado para código/configuração; não há rollback que reintroduza uma chave em claro.
