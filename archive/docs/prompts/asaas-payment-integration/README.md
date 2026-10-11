# Integração de pagamento Asaas — DevButter ↔ Selolibertaria

> **Supersedida para novas implementações em 2026-09-07:** esta série descreve o relay da
> `apiKey` para a Selo. A direção atual mantém a chave somente no `asaas_payment`; use
> [`../asaas-payment-proxy-internal/README.md`](../asaas-payment-proxy-internal/README.md).
> Este material permanece como histórico e não deve ser executado.

Índice desta série de prompts. Escopo: (1) relay de credenciais da subconta Asaas provisionada pelo `devbutter_backend` para o backend do Selolibertaria, com rotação/invalidação de chave em fluxo inverso; (2) consumo direto da API Asaas pelo backend FastAPI do Selolibertaria (sem passar pelo proxy mTLS `asaas_payment` do DevButter).

Base de pesquisa usada para montar esta série (não reler do zero — ver `00-levantamento-tecnico.md` para o resumo):
- `devbutter_app/asaas_payment/**` (proxy mTLS atual, README, models)
- `devbutter_app/devbutter_backend/app/{accounts,admin,webhooks,core/clients}/**`
- `devbutter_app/docs/plano-admin-asaas-integracao.md`, `docs/architecture/devbutter-platform-backend.md`
- `devbutter_app/docs/system_analysis/{00-06}.md` e `diagrams/*.mmd`
- `selolibertaria/backend/app/{payments,webhooks}/**` (estado atual: só Mercado Pago)
- Documentação oficial Asaas (subcontas, gerenciamento de API key de subconta, webhooks de conta e de pagamento) consultada via MCP `asaas` em 2026-08-28.

## Ordem de execução

Planejamento (ler, não implementar) → Implementação, na ordem abaixo. Nenhuma fatia de implementação roda sem o ADR (`01`) e o desenho de sistema (`02`) terem sido revisados por alguém do time — mesma disciplina usada em `devbutter_app/docs/prompts/payment-tokenization/`.

Ordem de implementação recomendada: `03` → `04`/`05` (podem em paralelo) → `07` → `08` → `06` → `09`. `07` destrava o `08`, e só depois de `08` o caminho relay funciona ponta a ponta; `06` valida o código, `09` faz o piloto real em sandbox antes de qualquer cutover.

Estado em 2026-08-29: `03`, `04`, `05` implementados e verdes no local (mock/fakes, não commitados). `07` implementado no `asaas_payment` (não commitado). Pendentes: `08` (wiring do consumidor), `06` (validação), `09` (piloto). Ver o log de execução no fim de cada arquivo.

| # | Arquivo | Objetivo | Repo alvo | Modelo recomendado |
|---|---------|----------|-----------|---------------------|
| 00 | `00-levantamento-tecnico.md` | Estado atual consolidado + itens urgentes/bloqueadores | — (leitura) | qualquer |
| 01 | `01-adr-integracao-asaas.md` | ADR: arquitetura de credenciais (relay + rotação) | — (decisão) | raciocínio alto |
| 02 | `02-system-design-payment-service.md` | Desenho do serviço de pagamento direto no backend Selolibertaria | — (decisão) | raciocínio alto |
| — | `diagrams/fluxo-existente.mmd` | Fluxo AS-IS (o que já existe hoje) | — | — |
| — | `diagrams/fluxo-novo-provisionamento-e-rotacao.mmd` | Fluxo TO-BE: provisionamento + rota específica + webhook de rotação | — | — |
| — | `diagrams/fluxo-novo-pagamento-direto.mmd` | Fluxo TO-BE: checkout consumindo Asaas direto do FastAPI | — | — |
| 03 | `03-prompt-devbutter-relay-e-rotacao.md` | Implementar relay + rotação no `devbutter_backend` | `devbutter_app/devbutter_backend` | implementação |
| 04 | `04-prompt-selolibertaria-asaas-client-checkout.md` | Cliente Asaas direto + checkout no backend Selolibertaria | `selolibertaria/backend` | implementação |
| 05 | `05-prompt-selolibertaria-webhook-recebimento.md` | Rotas de recebimento (relay, rotação, webhook de pagamento) no Selolibertaria | `selolibertaria/backend` | implementação |
| 07 | `07-bloqueador-apikey-nao-e-relayavel.md` | Rota `relay-credential` no `asaas_payment` (decisão + implementação) | `devbutter_app/asaas_payment` | raciocínio alto → implementação |
| 08 | `08-prompt-devbutter-consumir-relay-credential.md` | `devbutter_backend` passa a chamar `relay-credential` (fecha o e2e do relay) | `devbutter_app/devbutter_backend` | implementação |
| 06 | `06-prompt-validacao-seguranca-e2e.md` | Revisão de segurança ponta a ponta, disciplina NO-GO | ambos | raciocínio alto |
| 09 | `09-prompt-piloto-sandbox-e-cutover.md` | Piloto sandbox ponta a ponta + plano de cutover/rollback | os três repos (config) | raciocínio médio |

## Convenções

Mesmo padrão de `devbutter_app/docs/prompts/`: cada arquivo numerado tem uma metade de instruções (escopo de leitura, entregáveis, proibições explícitas) e, após execução, um log de execução anexado no final com `---` e blocos `## Executado — ...` (Data, Chat, Modelo, Resultado, Decisão/Bloqueios). Não sobrescrever o log — apenas anexar.

Nenhuma fatia de implementação deve chamar a API de produção da Asaas ou rotacionar uma chave real de subconta sem aprovação explícita registrada no log de execução.
