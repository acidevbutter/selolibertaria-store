# ADR-0002: Ponte temporária de checkout direto à Asaas para o lançamento da loja

**Status:** Accepted (temporário, com condição de expiração explícita — ver Consequences)
**Date:** 2026-09-13
**Deciders:** Marcos Pereira (Selolibertaria/DevButter)

## Context

A série `asaas-payment-proxy-internal` (`00-adr-proxy-interno.md`) é a direção
arquitetural vigente: a `apiKey` da subconta Asaas fica cifrada somente no banco do
`asaas_payment`, e o Selolibertaria consome pagamentos via proxy mTLS
(`AsaasProxyClient`), sem nunca ver a chave. O código do `backend` já foi migrado para
esse modelo (commits `56ff91d`, `b8367eb`, `f3860b9`, `33654e1` — 2026-09-12/13), e o
modo direto/mock anterior foi removido de `Settings`.

O problema: a loja Selolibertaria precisa **estrear agora**, e a implementação completa
do lado `asaas_payment`/proxy (certificado `sales-api`, adoção de subconta, validação
E2E de segurança — prompts `01` a `05` desta série) ainda não terminou nem foi validada
em pré-produção. Esperar o proxy ficar pronto adia o lançamento por um prazo
indeterminado. A alternativa é abrir uma exceção temporária, documentada, com critério
claro de quando ela se encerra — para não repetir o padrão já visto neste repositório de
trocar de arquitetura (relay-direto → proxy) sem registro explícito de por quê.

Este ADR não reverte a decisão de `00-adr-proxy-interno.md`. Ele abre uma **janela de
exceção** sobre ela.

## Decision

Introduzir uma flag de configuração (`Settings`, ex.: `asaas_checkout_mode:
Literal["proxy", "direct"] = "proxy"`) que, quando ligada para `"direct"`, faz o
`AsaasClient` do `backend` do Selolibertaria chamar a API da Asaas **diretamente**, usando
uma `apiKey` de produção real lida de variável de ambiente (`ASAAS_API_KEY`, tipada como
`SecretStr`), em vez de passar pelo `AsaasProxyClient`.

Enquanto a flag estiver em `"direct"`:
- `AsaasProxyClient`, `mirror_client.py`, `credential_store.py` e as rotas de relay
  (`integrations_router.py`) permanecem no código, montados e intactos — não são
  removidos nem desativados no nível de router. Apenas não são chamados pelo caminho de
  checkout.
- Todo pagamento processado é gravado normalmente na tabela `payment` local
  (`checkout_service.py` já reconcilia independente de quem respondeu), com uma coluna
  nova `processed_via` (`proxy`/`direct`) para auditoria.
- O espelho no banco do `asaas_payment` (via `mirror_client.py`) não é alimentado em
  tempo real nesse período, porque também depende do proxy mTLS que está sendo
  contornado.

## Options Considered

### Option A: Esperar o proxy ficar pronto e validado antes de lançar a loja
| Dimensão | Avaliação |
|---|---|
| Complexidade | Baixa (nenhum código novo) |
| Risco de segurança | Nenhum adicional |
| Aderência ao objetivo de negócio | **Baixa** — atrasa o lançamento por prazo indeterminado |
| Reversibilidade | N/A |

**Prós:** nenhuma exceção arquitetural, nenhum segredo real fora do `asaas_payment`.
**Contras:** contraria a necessidade de negócio de estrear agora; sem previsão de término da série `proxy-internal`.

### Option B: Ponte temporária com flag direto-à-Asaas, escopo e critério de reversão documentados — **escolhida**
| Dimensão | Avaliação |
|---|---|
| Complexidade | Média (novo client mínimo, novo campo de settings, coluna de auditoria) |
| Risco de segurança | Médio — `apiKey` de produção real em variável de ambiente do processo do `backend`, contrariando o desenho do proxy (que existe exatamente para evitar isso) |
| Aderência ao objetivo de negócio | **Alta** — loja no ar imediatamente |
| Reversibilidade | Alta — flag por config, nenhum caminho antigo é removido, rotação de chave planejada na reversão |

**Prós:** desbloqueia o lançamento sem esperar o proxy; não deleta nem compete com o
trabalho já commitado do proxy; caminho de reversão é uma mudança de config, não um
resgate de código.
**Contras:** reintroduz, por um tempo limitado, exatamente a exposição de segredo que o
`00-adr-proxy-interno.md` foi desenhado para eliminar; exige backfill manual do espelho
no `asaas_payment` depois; exige disciplina para não "esquecer a flag ligada".

### Option C: Reverter permanentemente para a arquitetura de relay-direto (ADR-0001)
| Dimensão | Avaliação |
|---|---|
| Complexidade | Alta (desfazer `56ff91d`…`33654e1`) |
| Aderência ao objetivo de negócio | Baixa — troca de arquitetura de novo, sem resolver por que o proxy não está pronto |

Descartada: seria a terceira reversão de direção neste repositório sobre a mesma
pergunta (relay-direto → proxy → relay-direto de novo), sem que nada tenha mudado na
avaliação técnica que levou ao proxy. Repetir a troca sem motivo novo é o próprio
problema que este ADR tenta evitar ao ser explícito.

## Trade-off Analysis

A urgência de negócio (lançar agora) é real e maior que o custo de manter, por um
período curto e explicitamente delimitado, uma exposição de segredo que o desenho do
proxy queria eliminar. O que torna isso aceitável é: (1) a flag por config, não uma
reescrita — o caminho proxy não é tocado, só contornado; (2) toda gravação local
(pagamentos, pedidos) continua completa e correta independente do modo, então não há
perda de informação de negócio; (3) o único débito real é o espelho no `asaas_payment` e
a rotação da chave na volta, ambos com plano explícito abaixo, não deixados para
descobrir depois. O que não é aceitável é deixar essa exceção sem prazo — por isso o
critério de reversão é parte da decisão, não um "action item" solto.

## Consequences

- **Fica mais fácil:** lançar a loja Selolibertaria imediatamente, sem bloquear no
  cronograma da série `proxy-internal`.
- **Fica mais difícil:** auditar "por onde passou cada pagamento" sem a coluna
  `processed_via`; por isso ela é parte da decisão, não opcional.
- **Vamos precisar revisitar (condição de encerramento desta ADR):** esta ponte
  **termina** quando a implementação do `asaas_payment`/proxy (prompts `01`–`05` desta
  série) estiver concluída **e** validada em pré-produção/sandbox conforme
  `05-validacao-sandbox-go-no-go.md`. Nesse momento:
  1. Rodar o backfill do espelho `asaas_payment` a partir do histórico local
     (`payment`/`order_drafts.asaas_charge_id`) mais a API da própria Asaas, de forma
     idempotente (mesmo padrão de `AsaasRelayEvent`).
  2. Rotacionar/revogar na Asaas a `apiKey` real que ficou em `ASAAS_API_KEY` — não
     apenas apagar a variável de ambiente.
  3. Virar `asaas_checkout_mode` de volta para `"proxy"`.
  4. Registrar no log de execução deste arquivo a data de encerramento e quem validou o
     go/no-go.
  - Esta ADR não deve ser tratada como decisão permanente nem citada como justificativa
    para adiar a série `proxy-internal`.

## Action Items

1. [ ] Adicionar `asaas_checkout_mode: Literal["proxy", "direct"] = "proxy"` e
   `asaas_api_key: SecretStr | None = None` em `app/settings/config.py`.
2. [ ] Implementar um `AsaasDirectClient` mínimo com a mesma interface que
   `checkout_service.py` já espera de `AsaasClient`, sem alterar `AsaasProxyClient`.
3. [ ] Migration para `payment.processed_via` (`proxy`/`direct`, nullable).
4. [ ] Definir e documentar aqui o job de backfill do espelho `asaas_payment` (a rodar
   na reversão, não antes).
5. [ ] Limpar `ASAAS_CLIENT_MODE`/`ASAAS_BASE_URL`/`ASAAS_ACCOUNT_ID` órfãos do `.env`
   real do `backend` (issue
   [selolibertaria_backend#9](https://github.com/acidevbutter/selolibertaria_backend/issues/9))
   antes de introduzir o novo `ASAAS_API_KEY`, para não conviver duas variáveis de
   "modo" com nomes parecidos.
6. [ ] Ao encerrar a ponte: executar os 4 passos da seção Consequences e apagar este
   item da lista de pendências ativas (o ADR em si fica como histórico, não é
   deletado).

---

## Executado — 2026-09-13

- Chat: continuação desta mesma conversa (estratégia → ADR → implementação).
- Modelo: claude-sonnet-5.
- Repo/branch: `selolibertaria/backend`, branch `feature/asaas-direct-checkout-bridge`
  (a partir de `staging`, HEAD `c43bd18`). Nada commitado ainda — só working tree.
- Resultado (itens 1-4 do Action Items, código):
  - `app/settings/config.py`: `asaas_checkout_mode` (`"proxy"` default / `"direct"`),
    `asaas_api_key: SecretStr | None`, `asaas_direct_base_url`; validator
    `require_asaas_api_key_in_direct_mode` recusa subir com `direct` e sem chave.
  - `app/asaas/direct_client.py` (novo): `AsaasDirectClient`, mesma interface pública
    de `AsaasProxyClient`, autentica via header `access_token` (apiKey nunca logada).
  - `app/asaas/provider_mapping.py` (novo): `map_customer/map_charge/map_invoice`
    extraídos de `proxy_client.py` para não duplicar o parsing do shape da Asaas entre
    os dois transportes.
  - `app/asaas/client.py`: `_transport()` escolhe `AsaasProxyClient` ou
    `AsaasDirectClient` por `settings.asaas_checkout_mode`; removido o parâmetro
    `credential_store` (nunca usado — resolve também
    [selolibertaria_backend#8](https://github.com/acidevbutter/selolibertaria_backend/issues/8)).
  - `app/payments/models.py`: `PaymentChannel` (`PROXY`/`DIRECT`) +
    `Payment.processed_via` (nullable, setado só na criação — não sobrescreve em
    reconciles depois de uma reversão de modo).
  - `alembic/versions/20260913_1200_add_processed_via_to_payment.py`: migration da
    coluna acima (head novo, revises `20260907_1435`).
  - `.env`/`.env.example`: adicionados `ASAAS_CHECKOUT_MODE`/`ASAAS_API_KEY`/
    `ASAAS_DIRECT_BASE_URL`; removidos de `.env` os órfãos `ASAAS_CLIENT_MODE`,
    `ASAAS_BASE_URL`, `ASAAS_REQUEST_TIMEOUT_SECONDS` (resolve
    [selolibertaria_backend#9](https://github.com/acidevbutter/selolibertaria_backend/issues/9)
    — `ASAAS_ACCOUNT_ID` mantido: ao contrário do que a issue #9 dizia, ele **é** lido
    por `Settings.asaas_account_id` e segue em uso pelo proxy).
  - Testes novos: `tests/test_asaas_direct_client.py`, `tests/test_asaas_client_mode.py`,
    + casos em `tests/test_database_settings.py` (validator) e
    `tests/test_asaas_checkout.py` (`processed_via`).
  - Verificação: `poetry run ruff check .` limpo; `poetry run mypy app` limpo (137
    arquivos); `poetry run python -m pytest -q` → **106 passed**; `alembic heads`/
    `alembic history` confirmam a cadeia de migração.
- Decisão/Bloqueios:
  - **Nenhuma chave real de produção foi usada ou configurada** neste slice — só o
    mecanismo. Ligar `ASAAS_CHECKOUT_MODE=direct` com uma `ASAAS_API_KEY` real de
    produção continua sendo uma decisão operacional separada, tomada por quem tem a
    chave, no ambiente de destino (não local, não neste diff).
  - Pendente (não implementado neste slice, por desenho — ver Action Item 4): o job de
    backfill do espelho `asaas_payment` só deve ser construído/rodado no momento da
    reversão, não antes.
  - Não commitado — branch local aguardando revisão antes do commit/push.
