# DEV-147 — Operações administrativas de pagamento

## Validado

- O admin consulta a order no Mercado Pago antes de oferecer a operação.
- Cancelamento é elegível apenas para order `pending`; estorno total apenas para `approved`.
- Valor, moeda e `external_reference` são conferidos contra o pedido local.
- A mesma chave de idempotência é usada em retries por order e operação.
- O pedido local e o histórico mudam somente após confirmação do provedor.

## Reaproveitado e reconstruído

- Reaproveitados o adapter Orders, autenticação/capability `orders.update_status`, auditoria e UI do detalhe do pedido.
- Reconstruída a rota administrativa baseada em `mercadoPagoOrderId`, com fallback somente para pedidos legados.
- Nenhum PAN, CVV, token ou resposta bruta é persistido no histórico.

## Evidências

- `yarn test`: 153 aprovados, 1 skipped.
- `yarn lint`, `tsc --noEmit`, `git diff --check` e `yarn build`: aprovados.
- Browser: `/admin/orders` e detalhe de pedido carregados; controles exibidos e corretamente desabilitados para estado `processing`.
- Sandbox real não foi executado nesta sessão porque o `mercado-pago-mcp` não estava conectado.
- O build e a tela admin registraram timeout do Mongo settings de `1800ms`, com fallback seguro.
