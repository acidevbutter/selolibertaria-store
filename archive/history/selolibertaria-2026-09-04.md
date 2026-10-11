# 2026-09-04 — Fluxo Asaas: provisionamento e rotação

- Corrigido `docs/prompts/asaas-payment-integration/diagrams/fluxo-novo-provisionamento-e-rotacao.mmd` para refletir o ADR-0002: `asaas_payment` mantém a credencial e o Selolibertaria consome por mTLS, sem relay de `apiKey`.
- Explicitados no diagrama os bloqueios atuais: contrato de referência entre DBB/Selo, rotação automática no proxy e integração E2E/produção ainda não comprovadas.
