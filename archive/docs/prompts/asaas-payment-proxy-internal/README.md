# Asaas via `asaas_payment` — plano de implementação

**Status:** planejamento aprovado nesta conversa; não implementado.

Esta série substitui o desenho de relay de credencial da pasta irmã
`../asaas-payment-integration/`: a `apiKey` fica cifrada exclusivamente no banco do
`asaas_payment`. DevButter e Selo autenticam-se como serviços e nunca recebem a chave.

## Ordem

| # | Arquivo | Repo alvo | Objetivo |
|---|---|---|---|
| 00 | `00-adr-proxy-interno.md` | documentação | Congelar decisão, limites e migração |
| 01 | `01-contrato-commerce-proxy.md` | documentação | Contratos HTTP, erros e eventos |
| 02 | `02-asaas-payment-commerce-api.md` | `devbutter_app/asaas_payment` | Implementar o proxy de comércio |
| 03 | `03-selo-adotar-commerce-proxy.md` | `selolibertaria/backend` e `selolibertaria-store` | Consumir o proxy e ligar checkout |
| 04 | `04-remover-relay-credential.md` | três repos | Retirar o caminho que exporta a chave |
| 05 | `05-validacao-sandbox-go-no-go.md` | três repos | Validar E2E e decidir liberação |
| 06 | `06-adr-ponte-temporaria-modo-direto.md` | `selolibertaria/backend` | ADR-0002: ponte temporária de checkout direto à Asaas até `02`–`05` estarem prontos e validados |

Execute uma fatia por vez, revise o diff e rode os testes antes da próxima. Nenhuma
fatia pode chamar a API de produção, rotacionar segredo real ou remover dados/rotas em
produção sem autorização explícita.

**2026-09-13:** loja Selolibertaria lançou antes desta série terminar. `06` documenta
uma exceção temporária e explícita (checkout direto à Asaas via flag, apiKey real em
env) enquanto `02`–`05` não estão concluídos/validados em pré-produção. Não é uma
mudança de direção desta série — ver critério de encerramento em `06`.
