# 07 — Bloqueador: `asaas_payment` nunca expõe a `apiKey` da subconta (relay não tem o que enviar)

**Encontrado durante a implementação de `03` (2026-08-28)**, não pela pesquisa original em `00`. Este arquivo é o formato "prompt novo" para uma rodada futura — não é implementação em si.

## O problema

`03` implementou o cliente de saída que deveria enviar a `apiKey` da subconta ao Selolibertaria (relay inicial e rotação). Ao revisar `devbutter_app/asaas_payment` de perto, `hide_api_key=True` é aplicado não só em `POST /subaccounts` (já documentado em `00`), mas também em **`POST /subaccounts/{id}/access-tokens`** — ou seja, mesmo o fluxo "certo" (criar um access token novo, dedicado ao relay) não devolve a chave em nenhuma resposta do `asaas_payment` para o `devbutter_backend`. Resultado: hoje **não existe nenhum caminho pelo qual `devbutter_backend` obtenha uma `apiKey` em texto utilizável** para repassar ao Selolibertaria — a implementação de `03` detecta isso e marca o link como `blocked`/`rotation_blocked` em vez de enviar um valor vazio/inválido, mas o relay fica permanentemente bloqueado até isso ser resolvido.

## Repositório alvo

`devbutter_app/asaas_payment` (proxy mTLS, único detentor da API key raiz — fora do escopo de leitura original de `03`/`05`).

## O que decidir (voltar para o time, não implementar direto)

1. Adicionar uma rota admin nova em `asaas_payment`, gated por um CN dedicado (ex. `RELAY_CLIENT_CNS`, não reusar `ADMIN_CLIENT_CNS` genérico), que devolve a `apiKey`/token **uma única vez**, no momento da criação, especificamente para o caso de uso "provisionar credencial para relay a um produto parceiro" — versus
2. Mudar `hide_api_key` para `False` condicionalmente (por CN chamador) na rota de access-tokens existente — menor mudança de superfície, mas mistura semântica de "uso normal" com "uso de relay".
3. Reconfirmar com o time se a intenção original de `hide_api_key=True` era só proteção de log/resposta acidental, ou uma decisão de segurança deliberada de nunca deixar a chave sair do `asaas_payment` — se for a segunda, a Opção B do ADR-0001 (relay direto) pode não ser viável e vale reabrir o ADR.

## Impacto

Bloqueia o "GO" de `06` (validação e2e) e qualquer piloto real — `03`/`04`/`05` estão implementados e testáveis com mocks, mas o caminho ponta-a-ponta com uma subconta real não funciona até isto ser resolvido. Não bloqueia o desenvolvimento continuado de `04` (checkout), que pode seguir mockado.

---

## Log de execução

_(anexar aqui após a decisão e/ou implementação desta fatia.)_

## Executado — Opção 1: rota dedicada + CN próprio no `asaas_payment`

- Data: 2026-08-29
- Chat: Claude Code (terminal, máquina do usuário)
- Modelo: claude-sonnet-5
- Decisão: **Opção 1** (rota admin nova, CN dedicado). Escolhida pelo usuário. Não
  mexe na semântica da rota de access-tokens existente; mantém o caminho de relay
  auditável à parte; `RELAY_CLIENT_CNS` é uma allowlist separada de
  `ADMIN_CLIENT_CNS` (revelar chave é grant mais perigoso que configurar split).
- Resultado (repo `devbutter_app/asaas_payment`, branch `staging-pre-prod`, não commitado):
  - `app/settings/config.py`: novo `relay_client_cns` + propriedade `relay_client_cn_list`.
  - `app/core/security.py`: novo dependency `require_relay_client` (mesmo padrão de
    `require_payment_client` — 403 se o CN não estiver em `relay_client_cn_list`).
  - `app/subaccounts/schemas.py`: `RelayCredentialRead` (`accountId`, `walletId`,
    `apiKey`, `accessTokenRef`) — mapeia 1:1 no que o relay do `03` espera.
  - `app/subaccounts/service.py`: `get_relay_credential(identity, account_id)` —
    reusa `get_owned` (ownership por `client_id`: o CN de relay tem que ser o mesmo
    que provisionou a subconta) + decifra `Subaccount.encrypted_api_key` (a chave
    capturada em `POST /v3/accounts`, já retida cifrada). Refatorado `get_api_key`
    para compartilhar `_decrypt_api_key`.
  - `app/subaccounts/router.py`: `POST /subaccounts/{account_id}/relay-credential`,
    gated por `require_relay_client`, **sem `_passthrough`/`hide_api_key`** — é a
    única rota que devolve `apiKey` em claro, por desenho.
  - `.env.example`: `RELAY_CLIENT_CNS=` (vazio; só o CN do `devbutter_backend` em
    ambiente compartilhado).
  - `accessTokenRef` sempre `null` por ora: minta de token novo de subconta pela
    conta-pai depende da janela manual de 2h da Asaas (item D.1) — a chave relayada
    é a raiz da subconta, capturada na criação.
  - Testes: `tests/test_subaccounts_relay_credential.py` (5): CN de relay + dono →
    200 com `apiKey` em claro (e a rota de create continua **redigindo**); CN fora
    de `RELAY_CLIENT_CNS` → 403 (sem vazar a chave no corpo); conta desconhecida →
    404; conta de outro `client_id` → 404 (ownership); subconta sem chave retida →
    500.
  - Verificação: `poetry run python -m pytest -q` → **75 passed** (70 baseline + 5);
    `ruff check` limpo; `mypy` limpo nos arquivos tocados.
- Decisão/Bloqueios:
  - **Falta a ponta do consumidor**: `devbutter_backend/app/core/clients/asaas_client.py`
    ainda não tem método `get_relay_credential(account_id)` e
    `app/integrations/relay_service.py` ainda lê `apiKey` da resposta (redigida) de
    `create_access_token` — por isso o caminho de relay do `03` continua marcando
    `blocked`/`rotation_blocked`. Wiring pendente (muda a assinatura de
    `SelolibertariaRelayService` e ~5 arquivos de teste do `03`): a ser confirmado
    como fatia própria. Só depois disso o e2e (`06`) pode dar GO.
  - Não commitado nos dois repos — cada um precisa de branch própria.
