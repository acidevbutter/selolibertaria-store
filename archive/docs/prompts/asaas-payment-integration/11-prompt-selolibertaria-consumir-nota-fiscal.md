# 11 — Prompt de implementação: emitir nota fiscal ao confirmar pagamento

**Repositório alvo:** `selolibertaria/backend`
**Modelo recomendado:** implementação (raciocínio médio)
**Pré-requisito:** `10` (proxy client) implementado; rota de nota fiscal do
`asaas_payment` implementada (ver prompt correspondente nesse repo).

## Escopo de leitura

- `app/asaas/webhook_service.py` — onde `Order.status` vira `succeeded`, ponto de
  gatilho natural para pedir a nota.
- `docs/architecture/adr-0002-asaas-subconta-proxy-nota-fiscal.md` (repo
  `devbutter_app`) — payload esperado por `POST /subaccounts/{account_id}/invoices`.
- `app/lib/order-status-notification.ts`/equivalente Python, se existir algo parecido no
  backend, para seguir o mesmo padrão de "ação disparada por mudança de status de
  pedido".

## Entregáveis

1. Ao processar um evento `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED` no webhook (ou em outro
   ponto que o time preferir, desde que disparado por confirmação real de pagamento —
   não por criação da cobrança), chamar `POST /subaccounts/{account_id}/invoices` via
   `AsaasProxyClient`, com os dados do pedido (`serviceDescription`, `value`,
   `customer`, `payment` id).
2. Guardar localmente (na tabela de `Order` ou uma nova tabela leve) o `invoice_id`
   devolvido e seu status — este é o lugar certo para esse dado, não o `asaas_payment`
   (ver `docs/architecture/adr-0002-addendum-rotas-dedicadas.md`, "Limite de dado").
3. Tratar o erro de "config fiscal ausente" (4xx específico do proxy) sem quebrar o
   fluxo de confirmação de pagamento — registrar e permitir emissão manual/retry
   depois, não bloquear o pedido.
4. Expor no `getPurchaseDetails`/rota equivalente de consulta de pedido o status da nota
   fiscal, se o frontend for exibir isso ao cliente.

## Restrições explícitas

- Não implementar emissão de nota fiscal síncrona bloqueando a resposta do checkout —
  isso acontece depois da confirmação de pagamento, de forma assíncrona (mesmo padrão
  do webhook já existente).
- Não duplicar a validação de payload que a rota do `asaas_payment` já faz — só montar
  o payload com os dados que este repo já tem.

## Testes

Cobrir: emissão disparada corretamente no evento certo; erro de config fiscal ausente
não derruba o processamento do webhook; `invoice_id` persistido e consultável.

Ao terminar, rode a suíte de testes do projeto e os checks de lint/type configurados.

---

## Log de execução

_(anexar aqui após cada rodada de implementação, mesmo formato dos demais arquivos desta série.)_
