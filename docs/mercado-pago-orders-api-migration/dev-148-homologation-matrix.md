# DEV-148 — Matriz de homologação Orders API

## Ambiente e identidade de teste

- Ambiente local: `localhost:3001` com MongoDB configurado fora do cliente.
- Conta de QA criada/reutilizável no MongoDB: `qa-orders-api-20260725@selo.test`.
- Identificador MongoDB: `6a6519d85ce889e048a0ea3b`.
- Perfil: `customer`, verificado, sem senha, cartão, Pix, sessão ou dado financeiro persistido.

## Evidência atual

| Cenário | Evidência | Resultado |
| --- | --- | --- |
| Regressão de domínio | `yarn test` | Aprovado: 157 testes, 1 ignorado |
| Qualidade estática | `yarn lint` e `yarn tsc --noEmit` | Aprovado |
| Conta de checkout | upsert/consulta MongoDB sanitizados | Aprovado |
| Checkout embutido | Browser local em 2026-07-26 mostrou Pix, cartão e Brick sem redirecionamento; console sem erros/warnings | Aprovado visualmente, sem cobrança criada |
| Pix e cartão sandbox | requer consulta/operação pelo MCP Mercado Pago | Pendente: OAuth `invalid_client` |
| Webhook duplicado, reconciliação, cancelamento e estorno sandbox | requer operação controlada e MCP Mercado Pago | Pendente |
| Build de produção | `yarn build` antes do servidor de desenvolvimento | Aprovado |

## Segurança e rollback

- Public Key permanece no frontend; Access Token e segredo de webhook permanecem apenas no servidor.
- A conta de QA não contém dados pessoais reais nem material de pagamento.
- Não registrar QR Code, código Pix, token, PAN, CVV, CPF, telefone, e-mail real ou segredo em evidências.
- Em falha de homologação, pausar novas tentativas e consultar o draft/order por `orderId`; o webhook e a reconciliação permanecem as fontes de verdade para transição financeira.

## Checklist de deploy e pós-deploy

1. Confirmar `MERCADO_PAGO_ACCESS_TOKEN`, chave pública, segredo de webhook e segredo da
   reconciliação somente no ambiente servidor.
2. Publicar com o cron de reconciliação protegido e monitorar erros normalizados, tentativas e
   alertas, sem registrar tokens ou dados de pagamento.
3. Após deploy, criar uma tentativa sandbox controlada, conferir `external_reference`, order,
   webhook, reconciliação e pedido interno antes de habilitar tráfego real.
4. Em divergência, pausar novas tentativas e investigar pelo `orderId`; não reativar a
   Payments API como fallback.
