# 08 — Prompt de implementação: `devbutter_backend` consome a rota `relay-credential`

**Repositório alvo:** `devbutter_app/devbutter_backend`
**Modelo recomendado:** implementação (raciocínio médio-alto — toca o caminho da credencial)
**Pré-requisito:** `07` implementado e verde no `asaas_payment` (rota
`POST /subaccounts/{id}/relay-credential`, gated por `RELAY_CLIENT_CNS`, devolvendo
`{accountId, walletId, apiKey, accessTokenRef}`). `03` já implementado e verde.

## Por que este arquivo existe

`03` implementou `SelolibertariaRelayService`, mas ele lê `apiKey` da resposta de
`AsaasClient.create_access_token(...)` — que o `asaas_payment` **redige**
(`hide_api_key=True`). Resultado: todo relay hoje cai em `_mark_blocked(...)` com
`selolibertaria_relay_status = "blocked"`/`"rotation_blocked"`. `07` adicionou a rota
que revela a chave para o CN do `devbutter_backend`; falta o `devbutter_backend`
**chamar** essa rota. Sem esta fatia, o e2e (`06`) não pode dar GO.

## Escopo de leitura (só isto)

- `devbutter_app/devbutter_backend/app/core/clients/asaas_client.py` (métodos
  `create_access_token`, `_request`, `get_asaas_client`)
- `devbutter_app/devbutter_backend/app/integrations/relay_service.py` (inteiro —
  `relay_initial_provisioning`, `relay_key_rotation`, `_mark_blocked`, as constantes
  `_MISSING_API_KEY_*`)
- `devbutter_app/devbutter_backend/app/integrations/rotation_service.py` (onde
  `relay_key_rotation` é chamado — `CredentialRotationService`)
- `devbutter_app/devbutter_backend/app/admin/companies_service.py`
  (`link_subaccount` — onde `relay_initial_provisioning` é chamado)
- `devbutter_app/devbutter_backend/scripts/run_proactive_rotation.py`
- `devbutter_app/asaas_payment/app/subaccounts/router.py` +
  `app/subaccounts/schemas.py` (`RelayCredentialRead`) — **só como referência do
  contrato de resposta**, não editar o `asaas_payment` aqui
- `07-bloqueador-apikey-nao-e-relayavel.md` (log de execução) e este arquivo

## Entregáveis

1. **Cliente**: `AsaasClient.get_relay_credential(account_id: str) -> dict[str, Any]`
   em `app/core/clients/asaas_client.py` — `POST
   /subaccounts/{account_id}/relay-credential` (sem body), mesmo `@log_call` /
   `_request` / tratamento de erro dos outros métodos. O `@log_call` **não pode**
   logar o corpo da resposta (contém `apiKey`); se o decorator existente logar
   retorno, adicionar um opt-out para este método (ex. `@log_call(redact_result=True)`
   ou não decorar e logar só `method/path/status`). Decidir e registrar no log.
2. **`SelolibertariaRelayService` passa a obter a credencial pela rota nova**:
   - Injetar um `AsaasClient` no `__init__` (novo parâmetro; default
     `get_asaas_client()` para não quebrar call sites que não passam — ou tornar
     obrigatório e ajustar os 4 call sites + fixtures; decidir e registrar).
   - Em `relay_initial_provisioning` e `relay_key_rotation`: se
     `access_token_response` **não** trouxer `apiKey` (caso normal agora), chamar
     `await self._asaas_client.get_relay_credential(link.asaas_account_id)` e usar
     `apiKey` / `accessTokenRef` / `walletId` de lá. Só cair em `_mark_blocked`
     se **essa** chamada também falhar (`UpstreamServiceError`) ou vier sem
     `apiKey` — aí a mensagem de bloqueio passa a ser "asaas_payment
     relay-credential indisponível / 403 — conferir RELAY_CLIENT_CNS", não mais a
     mensagem de redação.
   - `wallet_id`: preferir o do `link` se já preenchido; senão usar o da resposta.
   - `access_token_ref`: usar `accessTokenRef` da resposta (hoje `null` — ok, o
     schema do `05` aceita `None`).
3. **Não relaxar segurança**: `api_key` continua não sendo persistido em lugar
   nenhum do `devbutter_backend` (nem em `AsaasSubaccountLink`, nem em log, nem em
   `WebhookEvent.raw`). Só transita no corpo do `send_subaccount_provisioned` /
   `send_key_updated` já existentes.
4. **Atualizar as constantes/estados**: `_MISSING_API_KEY_PROVISIONING` /
   `_MISSING_API_KEY_ROTATION` deixam de descrever a redação; viram o texto do
   caso "rota relay-credential indisponível". Manter os status
   `blocked`/`rotation_blocked` (não inventar novos) para não quebrar
   `scripts/run_proactive_rotation.py` (que sai com exit 1 nesses status) nem o
   admin read model.
5. **Testes** (estender os do `03`, não criar suíte paralela):
   - `tests/test_selolibertaria_relay.py`: o happy path do relay inicial e da
     rotação agora passam por um `AsaasClient` fake cujo
     `get_relay_credential` devolve `{"accountId","walletId","apiKey","accessTokenRef":None}`
     → `selolibertaria_relay_status` vira `sent`/`acked`, `api_key` chega no
     payload enviado ao fake `SelolibertariaClient`, e **nada** de `apiKey` aparece
     em `AsaasSubaccountLink` nem em logs capturados.
   - Novo caso: `get_relay_credential` levanta `UpstreamServiceError` (simula 403
     por CN fora de `RELAY_CLIENT_CNS`, ou 404) → link vai para
     `blocked`/`rotation_blocked` com a mensagem nova.
   - `tests/test_integrations_router.py` e o disparo via
     `AdminCompaniesService.link_subaccount` continuam verdes (ajustar fixtures que
     constroem `SelolibertariaRelayService` para injetar o fake).
   - Regressão: `scripts/run_proactive_rotation.py` ainda sai 1 quando algum link
     fica `blocked` após a chamada.
6. Rodar de verdade nesta máquina: `poetry run python -m pytest -q` (suíte
   inteira, não só os arquivos tocados), `poetry run ruff check`, e conferir que
   `poetry run python -m mypy app/integrations/` não ganha erro novo além do
   padrão `untyped-decorator` já existente no repo.

## Restrições explícitas

- Não editar o `asaas_payment` nesta fatia (só ler o contrato).
- Nenhuma chamada à API de produção da Asaas nem ao `asaas_payment` de produção —
  os testes usam fakes; um teste de integração real fica para o `09` (piloto).
- Não mudar o contrato HMAC nem os payloads de `send_subaccount_provisioned` /
  `send_key_updated` (esses já batem com o `05` — ver `CONTRATO-HMAC.md`).
- Não persistir `apiKey`. Se algo precisar de "prova" de que a credencial foi
  obtida, usar `access_token_id`/`accessTokenRef` e `key_version`, nunca o valor.
- Manter os nomes de status (`blocked`, `rotation_blocked`, `sent`, `acked`,
  `failed`) — `scripts/`, admin schema e testes do `03` dependem deles.

---

## Log de execução

_(anexar aqui no formato `## Executado — <resumo>` com Data, Chat, Modelo,
Resultado, Decisão/Bloqueios, após cada rodada. Não sobrescrever.)_

## Executado -- 2026-09-05

- Data: 2026-09-05
- Chat: codex-cli
- Modelo: GPT-5
- Resultado: Não implementado; nenhum arquivo de código foi alterado. Checks do checkout atual: `poetry run python -m pytest -q` — 143 passed, 3 skipped; `poetry run ruff check` — passou.
- Decisão/Bloqueios: O HEAD `65ee89c` não contém `app/integrations/relay_service.py`, `app/integrations/rotation_service.py`, `scripts/run_proactive_rotation.py` nem os testes exigidos pelo prompt. A implementação do pré-requisito 03 existe no histórico em `80565d8`, mas foi removida por `584dad7`; restaurá-la exigiria uma mudança fora da fatia e dos arquivos autorizados. `poetry run python -m mypy app/integrations/` falhou porque o diretório não existe. Não foram feitas chamadas à Asaas nem alterações em `asaas_payment`.
