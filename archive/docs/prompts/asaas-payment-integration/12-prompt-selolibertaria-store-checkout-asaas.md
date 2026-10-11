# 12 — Prompt de implementação: formulário de checkout Asaas (`selolibertaria-store`)

**Repositório alvo:** `selolibertaria/selolibertaria-store`
**Modelo recomendado:** implementação (raciocínio médio-alto)
**Pré-requisito:** `04` e `05` implementados no `selolibertaria/backend`; contrato vigente do relay conforme `backend/docs/adr-0003-asaas-credencial-relay-direto.md`; `NEXT_PUBLIC_PAYMENTS_PROVIDER=asaas` disponível apenas em LOCAL/STAGING com `ASAAS_CLIENT_MODE=mock` no backend.

## Por que este arquivo existe

O andaime de `checkout-form.client.tsx` deixa o ramo Asaas em uma mensagem de migração. A página ainda bloqueia providers diferentes do fluxo atualmente paralisado. O backend já oferece a fronteira de checkout Asaas para clientes, cobranças e consulta de status; esta fatia especifica exclusivamente o consumidor Next.js Asaas, sem alterar o backend.

## Escopo de leitura (só isto)

- `selolibertaria-store/src/app/checkout/checkout-form.client.tsx` — roteamento atual e ramo Asaas pendente.
- `selolibertaria-store/src/app/checkout/mercado-pago-checkout-form.client.tsx` — somente como referência estrutural de preparação de comprador/entrega, estados e painéis; não alterar nem reativar o fluxo paralisado.
- `selolibertaria-store/src/app/checkout/page.tsx` — gate por provider, shell do checkout e placeholder de migração.
- `selolibertaria-store/src/app/checkout/prepare/`, `selolibertaria-store/src/app/checkout/processing/` e `selolibertaria-store/src/app/checkout/return/` — estágios existentes e limites que o fluxo Asaas não deve reutilizar indevidamente.
- `selolibertaria-store/src/lib/payments.ts` — `PAYMENTS_PROVIDER` e `isAsaasActive`.
- `selolibertaria-store/src/env.mjs` — `NEXT_PUBLIC_PAYMENTS_PROVIDER`, `NEXT_PUBLIC_ASAAS_ENV`, `FASTAPI_API_URL` e `FASTAPI_INTERNAL_API_KEY`.
- `selolibertaria-store/src/ui/sl/sl-payment-method-tabs.tsx`, `sl-pix-panel.tsx` e `sl-boleto-panel.tsx` — contratos visuais dos métodos e resultados.
- `selolibertaria-store/src/lib/favorite-discount-alerts.ts` — padrão de chamada server-side ao FastAPI.
- `backend/app/asaas/payments_router.py`, `schemas.py` e `checkout_service.py` — rotas, shapes e reconciliação existentes; não editar.
- `docs/prompts/asaas-payment-integration/README.md`, `04-*`, `05-*` e `08-*` — formato e disciplina desta série.
- `backend/docs/adr-0003-asaas-credencial-relay-direto.md` — arquitetura vigente: a loja chama o FastAPI; não chama `asaas_payment`.
- `selolibertaria-store/src/app/checkout/mercado-pago-checkout-form.client.test.tsx` — somente referência de padrão de teste; não alterar nem reativar o fluxo paralisado.

## Entregáveis

1. **Formulário Asaas e server action**

   - Criar `selolibertaria-store/src/app/checkout/asaas-checkout-form.client.tsx` como Client Component, espelhando o formulário MP para identificação, entrega, validação/normalização do comprador, cálculo da entrega, total, prevenção de duplo envio e estados acessíveis.
   - Adicionar a server action correspondente no módulo de actions de checkout existente. Ela deve preparar o comprador/entrega pelos actions disponíveis e, depois, executar customer → charge no FastAPI. Criar também a action server-side de consulta de charge para o polling.
   - O browser nunca chama o FastAPI diretamente e nunca recebe `FASTAPI_INTERNAL_API_KEY`. As actions usam `env.FASTAPI_API_URL`, `X-Internal-API-Key` e `cache: "no-store"`.
   - `NEXT_PUBLIC_ASAAS_ENV` não habilita modo live nem substitui `ASAAS_CLIENT_MODE`; em LOCAL/STAGING, o backend permanece em `mock`.
   - Reutilizar `/checkout/prepare` sem alterar seu comportamento. O fluxo Asaas direto deve manter a experiência de estados de processamento/sucesso/erro dentro do formulário; não depender de redirect ou parâmetros de outro provedor.

2. **Contrato exato loja → FastAPI**

   Todas as chamadas abaixo são feitas somente pela server action, para `\`${env.FASTAPI_API_URL}\``. POSTs usam `Content-Type: application/json`; todos os métodos usam `X-Internal-API-Key: env.FASTAPI_INTERNAL_API_KEY`; nenhum método envia credencial Asaas.

   **Criar ou obter customer**

   ```http
   POST /payments/asaas/customers
   X-Internal-API-Key: <FASTAPI_INTERNAL_API_KEY>
   Content-Type: application/json
   ```

   Corpo, conforme `AsaasCustomerCreate`:

   ```json
   {
     "name": "Nome normalizado",
     "cpf_cnpj": "somente os dígitos do CPF ou CNPJ",
     "email": "email-normalizado@exemplo.com",
     "phone": "telefone normalizado",
     "external_reference": "identificador estável do comprador, quando existir"
   }
   ```

   `email`, `phone` e `external_reference` podem ser `null`/omitidos somente conforme o schema. A resposta deve ser tratada como `AsaasCustomerRead`:

   ```json
   {
     "id": "cus_...",
     "name": "Nome",
     "cpf_cnpj": "...",
     "email": "...",
     "external_reference": "..."
   }
   ```

   **Criar charge**

   ```http
   POST /payments/asaas/charges
   X-Internal-API-Key: <FASTAPI_INTERNAL_API_KEY>
   Content-Type: application/json
   ```

   Corpo, conforme `AsaasChargeCreate`:

   ```json
   {
     "customer": "id retornado por AsaasCustomerRead.id",
     "billing_type": "PIX",
     "value": 149.90,
     "due_date": "YYYY-MM-DD",
     "external_reference": "orderId",
     "description": "descrição curta do pedido, quando usada"
   }
   ```

   `billing_type` é exatamente `PIX` ou `BOLETO` nesta fatia. `value` é BRL em reais, não centavos; converter o total do checkout em centavos para reais com arredondamento de duas casas. `due_date` é obrigatório, deve ser gerado no servidor e seguir uma única política documentada nos testes/log da implementação; nunca aceitar a data enviada pelo browser. `external_reference` deve ser o `checkout.orderId` para permitir a reconciliação do backend.

   A resposta é `AsaasChargeRead`:

   ```json
   {
     "id": "pay_...",
     "status": "PENDING",
     "value": 149.90,
     "customer": "cus_...",
     "billing_type": "PIX",
     "due_date": "YYYY-MM-DD",
     "external_reference": "ord_...",
     "invoice_url": null,
     "bank_slip_url": null,
     "pix_qr_code": "base64-do-qr-code",
     "pix_copy_paste": "codigo-pix"
   }
   ```

   **Consultar charge**

   ```http
   GET /payments/asaas/charges/{charge_id}
   X-Internal-API-Key: <FASTAPI_INTERNAL_API_KEY>
   ```

   Sem corpo; resposta com o mesmo shape `AsaasChargeRead`, incluindo obrigatoriamente `id`, `status` e `value` e os demais campos opcionais. O `charge_id` deve ser validado como o id retornado pelo POST, não como texto livre da URL do browser.

3. **Painéis PIX e boleto**

   - Usar `SlPaymentMethodTabs` com PIX e, somente quando `boletoEnabled` permitir, boleto. Não apresentar cartão nesta fatia: não existe captura/tokenização Asaas especificada.
   - Para PIX, mapear `pix_qr_code` para `SlPixPanel.qrCodeBase64` e `pix_copy_paste` para `SlPixPanel.code`; reutilizar o botão de cópia, mensagens `role="status"` e o rodapé de verificação. Não inventar QR, URL ou valor quando o backend não enviar o campo.
   - Para boleto, reutilizar `SlBoletoPanel`; não inventar linha digitável, pois ela não existe em `AsaasChargeRead`. Mapear `bank_slip_url` para `pdfUrl`, usando `invoice_url` somente como fallback. Exibir os links disponíveis em nova aba.
   - Se a charge PIX vier sem `pix_qr_code` ou `pix_copy_paste`, ou a charge boleto vier sem `bank_slip_url` e `invoice_url`, não exibir painel incompleto: mostrar erro recuperável e permitir tentar novamente/outro método.

4. **Polling e estados de UI**

   - Depois de criar uma charge PIX ou boleto, guardar apenas o `charge.id` e os dados não sensíveis necessários para renderização. Fazer consulta imediata e depois polling em `GET /payments/asaas/charges/{id}` a cada 1,5 s, com timeout total de 15 s, cancelando timers no unmount ou ao trocar de método/endereço.
   - Normalizar `status` sem diferenciar maiúsculas/minúsculas. Tratar `CONFIRMED`/`RECEIVED` e equivalentes já emitidos pelo mock como pago; tratar `OVERDUE`/`EXPIRED` e equivalentes como expirado. Estados desconhecidos permanecem pendentes até o timeout, nunca são tratados como pagos.
   - Exibir estados distintos e testáveis: `pending`/verificando, `paid`/aprovado, `expired`/expirado, `timeout`/não confirmado no prazo e `error`/falha de consulta. No estado pago, informar que o pagamento foi confirmado e impedir nova criação da mesma charge. No expirado, permitir gerar nova cobrança. No timeout, permitir nova consulta/tentativa sem duplicar automaticamente a cobrança.
   - O polling deve continuar usando a fonte de verdade retornada pelo FastAPI. Não consultar Asaas diretamente, não inferir pagamento pela existência do QR e não usar o status inicial do POST como confirmação final.

5. **Roteamento por flag**

   - Em `checkout-form.client.tsx`, quando `isAsaasActive` for verdadeiro, renderizar `AsaasCheckoutForm`; manter o fallback de provider desabilitado como rede de segurança.
   - Em `page.tsx`, permitir o provider Asaas ativo e remover o placeholder “Estamos migrando...” desse caminho. O provider `disabled` continua mostrando manutenção.
   - Tornar o resumo/avisos da página coerentes com Asaas. Não ampliar esta fatia para seleção de outro PSP.

6. **Tratamento de erro**

   - Para qualquer 4xx/5xx dos três endpoints, parsear `detail` quando seguro, normalizar uma mensagem amigável e preservar o status para logs/testes; nunca renderizar segredos, headers ou payload bruto.
   - Para FastAPI indisponível, timeout de rede ou JSON inválido, exibir estado de backend indisponível com retry explícito. O formulário não pode travar em `isSubmitting` nem criar polling infinito.
   - Diferenciar erro de criação de customer, erro de criação de charge e erro de consulta. Após falha, manter comprador/entrega preenchidos e permitir selecionar outro método.
   - Uma resposta 404/422/503 deve ser tratada como falha recuperável; não redirecionar para sucesso. Charge sem dados obrigatórios do painel deve seguir o critério do entregável 3.

7. **Plano de teste — somente LOCAL/STAGING**

   - Executar o backend com `ASAAS_CLIENT_MODE=mock`; confirmar que nenhum teste faz chamada à Asaas real. Não usar `ASAAS_CLIENT_MODE=live`.
   - Criar/ajustar testes de componente usando `mercado-pago-checkout-form.client.test.tsx` apenas como referência, cobrindo: seleção da flag Asaas; identificação/entrega; bodies exatos de customer e charge; conversão de centavos para reais; headers somente na server action; painel PIX com QR/copia-e-cola; painel boleto com `bank_slip_url`/`invoice_url`; ausência de campos; retry e estado de envio.
   - Com fake timers e actions mockadas, cobrir polling pendente → pago, pendente → expirado, timeout e cancelamento/unmount. Cobrir 4xx, 5xx, backend indisponível e JSON inválido sem estado de loading preso.
   - Verificar que o Asaas não depende de parâmetros, SDK ou actions do provedor paralisado.
   - Registrar os comandos e resultados reais no log do prompt após a implementação. Esta criação de spec não executa testes, build, deploy ou chamadas de rede.

## Restrições explícitas

- Não implementar nada nesta fatia de documentação.
- Criar somente `docs/prompts/asaas-payment-integration/12-prompt-selolibertaria-store-checkout-asaas.md` nesta tarefa; não editar outros arquivos.
- Não alterar nenhum arquivo do `selolibertaria/backend`, incluindo `payments_router.py`, `schemas.py` ou `checkout_service.py`.
- Não ligar `ASAAS_CLIENT_MODE=live`, não usar credencial real, não chamar a API Asaas real e não fazer deploy.
- O fluxo Mercado Pago está paralisado e é somente referência legada/fora de escopo; não reativar, ampliar ou migrar essa implementação nesta fatia. A flag de PSP por loja/conta fica fora desta fatia e deve ser tratada em issue separada; `NEXT_PUBLIC_PAYMENTS_PROVIDER` continua sendo a flag global atual.
- Não expor `FASTAPI_INTERNAL_API_KEY` no bundle/client, logs, mensagens ou respostas do browser. Não enviar `apiKey`, token Asaas ou qualquer segredo ao formulário.
- Não criar rota FastAPI, endpoint Asaas adicional, webhook novo, alteração de schema, reconciliação nova ou mudança no ADR-0003.
- Não tratar QR existente, resposta HTTP 200 ou status desconhecido como pagamento confirmado. Só o polling com status pago encerra a cobrança.
- Não executar build, testes, lint, migração, deploy ou chamadas de rede durante a escrita deste prompt.

## Log de execução

_(vazio para a execução da implementação; o registro abaixo documenta somente a criação desta spec.)_

## Executado — 2026-09-05

- Data: 2026-09-05
- Chat: codex-cli
- Modelo: GPT-5
- Resultado: Spec criada sem implementação, cobrindo formulário/action Asaas, contratos customers/charges/status, painéis PIX/boleto, polling, roteamento por flag, erros e testes locais/staging em modo mock.
- Decisões/Dúvidas em aberto: `due_date` deve seguir política server-side única e ser fixada nos testes; o checkout Asaas é direto e não deve depender dos estágios/redirects do fluxo paralisado; cartão `CREDIT_CARD` permanece fora da UI desta fatia; PSP por loja/conta continua em issue separada.
