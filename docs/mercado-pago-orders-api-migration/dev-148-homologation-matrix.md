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
| Checkout embutido | Browser local mostrou Pix, cartão e Brick sem redirecionamento | Aprovado anteriormente; sem nova captura nesta sessão |
| Pix e cartão sandbox | requer consulta/operação pelo MCP Mercado Pago | Pendente: OAuth `invalid_client` |
| Webhook duplicado, reconciliação, cancelamento e estorno sandbox | requer operação controlada e MCP Mercado Pago | Pendente |
| Build de produção | não executar concorrente a `yarn dev` | Pendente até o servidor local ser encerrado |

## Segurança e rollback

- Public Key permanece no frontend; Access Token e segredo de webhook permanecem apenas no servidor.
- A conta de QA não contém dados pessoais reais nem material de pagamento.
- Não registrar QR Code, código Pix, token, PAN, CVV, CPF, telefone, e-mail real ou segredo em evidências.
- Em falha de homologação, pausar novas tentativas e consultar o draft/order por `orderId`; o webhook e a reconciliação permanecem as fontes de verdade para transição financeira.
