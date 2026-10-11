# Selolibertaria — 2026-09-07

- Adicionada a série de planejamento `docs/prompts/asaas-payment-proxy-internal/` para substituir o relay de credencial por chamadas de comércio via `asaas_payment`, mantendo a `apiKey` exclusivamente no proxy.
- Checkout de homologação migrou para PIX hospedado Asaas: `OrderDraft.asaas_charge_id`, migration aditiva, finalização idempotente por callback/webhook e Storefront direcionado à `invoiceUrl`. Validação local passou; Sandbox, migration aplicada, cert mTLS e webhook permanecem pendentes.
