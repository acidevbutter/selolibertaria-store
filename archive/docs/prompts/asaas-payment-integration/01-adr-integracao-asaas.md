# ADR-0001: Arquitetura de credenciais Asaas entre DevButter e Selolibertaria

**Status:** Proposed
**Date:** 2026-08-28
**Deciders:** time DevButter (dono do `asaas_payment` e `devbutter_backend`) + time Selolibertaria (dono do `backend` e `selolibertaria-store`)

## Context

Hoje o `devbutter_backend` já sabe provisionar subcontas Asaas (via proxy mTLS `asaas_payment`) e já recebe webhooks da Asaas diretamente (`POST /webhooks/asaas`). O Selolibertaria não tem nenhuma integração Asaas — usa Mercado Pago. O pedido de negócio é: quando um cliente se cadastra no DevButter e tem a conta confirmada, o DevButter abre a subconta Asaas, gera o token de acesso, guarda isso no `asaas_payment`, e o **identificador que relaciona esses dados** precisa chegar ao banco do Selolibertaria por uma rota específica — e depois, quando a chave vencer ou ficar inválida, um webhook precisa atualizar essa chave no Selolibertaria (fluxo inverso). Além disso, o Selolibertaria deve consumir a API da Asaas **diretamente** do seu próprio backend FastAPI (não recriar um segundo proxy mTLS `asaas_payment`).

Restrições descobertas na pesquisa (`00-levantamento-tecnico.md`): a Asaas não emite webhook de "chave inválida/expirada" — isso tem que ser fluxo próprio; a rotação administrativa de token de subconta na Asaas exige uma janela manual de 2h habilitada na interface; a `apiKey` só é visível uma vez. Isso significa que qualquer solução tem que decidir *quem guarda a chave em texto utilizável* e *como ela atravessa a rede entre os dois backends*.

## Decision

Adotar um modelo de **relay de credencial com dupla via de rotação (push proativo + pull reativo)**: o `devbutter_backend` continua sendo o único orquestrador que fala com a Asaas para *gerenciar* a subconta (criar, obter token, rotacionar); ele envia o material da credencial ativa para o Selolibertaria por uma rota HTTP servidor-a-servidor autenticada e assinada (não mTLS completo — ver Opção B abaixo); o Selolibertaria armazena essa credencial cifrada em repouso e a usa para chamar a API pública da Asaas **diretamente**, sem proxy próprio. Rotação: o `devbutter_backend` roda um job proativo (checa `expiration_date`/eventos `ACCOUNT_STATUS_*`) e também expõe um endpoint reativo que o Selolibertaria chama ao detectar 401 da Asaas; em ambos os casos, o resultado (chave nova) é empurrado ao Selolibertaria via webhook assinado e idempotente.

## Options Considered

### Option A: Selolibertaria nunca vê a chave — tudo passa pelo proxy `asaas_payment` do DevButter
| Dimensão | Avaliação |
|---|---|
| Complexidade | Média (reusa proxy existente, só adiciona client CN novo) |
| Custo | Baixo (nenhuma infra nova) |
| Segurança | Alta (chave nunca sai do `asaas_payment`) |
| Aderência ao pedido | **Baixa** — usuário pediu consumo direto da Asaas pelo FastAPI do Selolibertaria |
| Acoplamento operacional | Alto — todo checkout do Selolibertaria depende da disponibilidade do `asaas_payment`/DevButter |

**Prós:** menor superfície de exposição de segredo; reaproveita mTLS e auditoria já existentes.
**Contras:** contraria explicitamente o requisito do usuário; contraria a decisão já registrada em `plano-integracao-asaas-payment.md` de "uma instância de proxy por produto" (o Selolibertaria teria que virar um client CN de um proxy que não é dele); acopla disponibilidade do checkout do Selolibertaria ao DevButter.

### Option B: Relay de credencial (chave atravessa uma vez, por rota assinada) + consumo direto — **escolhida**
| Dimensão | Avaliação |
|---|---|
| Complexidade | Média-alta (nova rota, novo webhook, novo armazenamento cifrado no Selolibertaria) |
| Custo | Baixo-médio |
| Segurança | Média-alta, condicionada a: TLS obrigatório, assinatura HMAC com timestamp+nonce (anti-replay), cifragem em repouso no Selolibertaria (mesmo padrão Fernet do `asaas_payment`), sem log de payload |
| Aderência ao pedido | **Alta** — é exatamente o fluxo descrito pelo usuário |
| Acoplamento operacional | Baixo em runtime (Selolibertaria chama Asaas direto); médio em provisionamento/rotação (depende do DevButter avisar) |

**Prós:** atende o requisito de consumo direto; desacopla o caminho crítico de checkout do DevButter; Selolibertaria ganha autonomia (pode até trocar de provedor de pagamento sem depender do proxy do DevButter).
**Contras:** duplica responsabilidade de segurança de segredo (agora dois lugares guardam chave cifrada); exige disciplina de rotação bem feita — se o webhook de atualização falhar silenciosamente, o Selolibertaria fica com uma chave morta e checkout quebra.

### Option C: Selolibertaria roda sua própria instância de `asaas_payment` (mTLS) com API key raiz própria, sem depender de subconta provisionada pelo DevButter
| Dimensão | Avaliação |
|---|---|
| Complexidade | Alta |
| Custo | Alto (nova infra, novo Postgres, novo CA) |
| Aderência ao pedido | Baixa — quebra a premissa de que é o DevButter quem abre a subconta no cadastro |

Descartada: contraria diretamente o fluxo de negócio descrito ("Cliente se cadastra no devbutter → sistema abre subaccount asaas").

## Trade-off Analysis

A decisão central é aceitar que a chave da subconta **precisa** trafegar do DevButter para o Selolibertaria pelo menos uma vez (na criação) e a cada rotação — não há como evitar isso e ainda cumprir "consumir a API direto do FastAPI". O ganho de autonomia/desempenho do Selolibertaria em runtime (Opção B) é trocado por mais um ponto de armazenamento de segredo e por uma dependência forte na confiabilidade do webhook de rotação. Mitigamos isso com: (1) idempotência e confirmação (ack) obrigatória em toda entrega de credencial — o DevButter só marca a rotação como concluída quando o Selolibertaria confirma a aplicação da nova chave; (2) retry com backoff no envio; (3) alerta operacional se uma credencial ficar "pendente de confirmação" por mais que alguns minutos; (4) o Selolibertaria trata falha de autenticação na Asaas (401) como sinal para acionar rotação reativa, não como erro fatal de checkout.

Sobre push vs. pull para a rotação: escolhemos **os dois**, não um só. Só push (proativo, agendado por `expiration_date`) não cobre invalidação inesperada (revogação manual, chave comprometida, `ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRED`). Só pull (reativo a 401) causa uma falha real de checkout antes de reagir. Rodar os dois é mais código, mas fecha os dois cenários.

## Consequences

- Fica mais fácil: Selolibertaria evoluir seu checkout Asaas sem esperar disponibilidade do proxy do DevButter; DevButter manter o `asaas_payment` como estava (nenhuma mudança nele além de, opcionalmente, permitir emissão de access token dedicado por consumidor).
- Fica mais difícil: auditar "quem tem a chave" — agora existem duas cópias cifradas (uma no `asaas_payment`, outra no Selolibertaria); qualquer revogação manual feita só de um lado deixa o outro lado com estado inconsistente até o próximo ciclo de rotação.
- Vamos precisar revisitar: se o volume de clientes crescer, a janela manual de 2h da Asaas (item D.1 do levantamento) pode virar gargalo real de operação — se a Asaas não oferecer um modo permanente, vale avaliar um processo batch assistido por humano em vez de rotação just-in-time.
- Questão em aberto para o dono de produto, não assumida por este ADR: **Asaas substitui Mercado Pago no Selolibertaria, ou os dois coexistem?** O desenho em `02-system-design-payment-service.md` assume coexistência via feature flag por loja/conta até resposta explícita.

## Action Items

1. [ ] Validar com a Asaas o item D.1 do levantamento técnico (janela de gerenciamento de token) antes de comprometer um SLA de rotação automática.
2. [ ] Definir e documentar o esquema de assinatura da rota de relay (HMAC-SHA256 + timestamp + nonce, chave de assinatura por par DevButter↔Selolibertaria, não reaproveitar `AUDIT_SIGNING_KEY` do `asaas_payment`).
3. [ ] Adicionar o CN/identidade equivalente do `devbutter_backend` em `ADMIN_CLIENT_CNS` do `asaas_payment` (pré-requisito já pendente, independente desta série).
4. [ ] Confirmar com produto: Asaas substitui ou coexiste com Mercado Pago no Selolibertaria.
5. [ ] Implementar conforme `03`, `04`, `05` e só então rodar `06` (validação) antes de qualquer chave real de produção.
