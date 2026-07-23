# DEV-156 — Reconectar fluxos reutilizáveis ao adapter de Orders

Baseado na classificação da DEV-152. Cobre apenas o que essa fase precisava mudar; itens
"reutilizável sem alteração" não aparecem aqui porque continuam intocados.

## Adaptado nesta fase

* `src/lib/order-identity.ts` — `OrderIdentifierLike.relatedIds` e `matchesOrderIdentifier`
  generalizados para aceitar `mercadoPagoOrderId` (Orders API) além do já existente
  `mercadoPagoPaymentId` (Payments API legada), sem substituir um campo pelo outro — mantém
  pedidos antigos casáveis pelo campo legado e novos pedidos pelo campo novo. Novo tipo
  compartilhado `OrderRelatedIds` elimina 4 redeclarações inline divergentes do mesmo shape.
* `src/lib/mongodb.ts` — `UserDoc.purchases[].relatedIds` agora usa `OrderRelatedIds`.
* `src/app/admin/orders/[id]/page.tsx`, `src/app/api/admin/orders/[id]/fulfillment/route.ts`,
  `src/actions/order-actions.ts` — filtros Mongo (`$or`) e tipos locais atualizados para casar
  pedidos também por `relatedIds.mercadoPagoOrderId`; label no admin passa a exibir "ID da
  order (Mercado Pago)" quando o pedido só tiver o identificador novo.

Teste: `src/lib/order-identity.test.ts` cobre match por id interno, por `mercadoPagoPaymentId`,
por `mercadoPagoOrderId`, com ambos presentes, e o caso de não-match.

## Reutilizável sem alteração (confirmado, nenhum código tocado)

Carrinho/frete (`cart-snapshot.ts`, `order-shipping-snapshot.ts`, `shipping.ts`), comprador
(`checkout-buyer.ts`, `checkout-customer.ts`), e-mails (`order-received.ts`,
`notify-order-status.ts`, `email-templates/*`), auditoria (`order-audit.ts`), fulfillment
(rota já reconectada acima, lógica de negócio inalterada), assinatura HMAC do webhook
(`validateMercadoPagoWebhookSignature`, pendente confirmação em sandbox de que a Orders API
usa o mesmo mecanismo — ver pergunta em aberto #2 da DEV-152).

## Direcionado para reconstrução (DEV-157)

Cartões salvos e operações de customer continuam isolados, pois a Orders API não oferece
contrato equivalente validado para esse fluxo. O restante do checkout, reconciliação e webhook
foi reconectado ao adapter na DEV-156.
