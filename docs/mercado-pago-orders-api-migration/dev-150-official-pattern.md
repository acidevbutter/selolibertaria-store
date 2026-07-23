# DEV-150 — Padrão oficial Mercado Pago

## Classificação final

| Ocorrência | Ação | Motivo |
|---|---|---|
| `/v1/payments` e DTOs de payment | Remover | Substituídos pelo contrato Orders/transações |
| Checkout, Pix, reconciliação e webhook | Reaproveitar/adaptar | Consumem o gateway Orders server-side |
| `mercadoPagoOrderId` | Reaproveitar/adaptar | Identificador externo canônico de order |
| Cartões salvos/customer | Reconstruir depois | Dependem de contrato oficial ainda não validado para Orders |
| `mercadoPagoPaymentId` histórico | Preservar | Compatibilidade de pedidos antigos, sem uso no checkout novo |
| Documentos de mapa/histórico | Falso positivo | Mantidos como registro da migração, não como caminho executável |

## Verificação

Não há referências executáveis a `/v1/payments`, `createMercadoPagoPayment` ou
`retrieveMercadoPagoPayment` em `src`. O SDK oficial só é instanciado no adapter
`src/lib/mercado-pago-orders/server-client.ts`. O script não versionado
`scripts/resolve-linear-epic.sh` foi preservado e não participa do fluxo.
