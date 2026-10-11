# 2026-08-28 — prompts coordenados da migração FastAPI/BFF

- Adicionada apresentação comercial/técnica da operação DevButter na AWS para
  o Selo Libertária: arquitetura Vercel + AWS para três sites de baixo tráfego,
  fluxo automático de conta, segurança, comissão de 1% sobre o líquido e
  cenários financeiros explícitos.

- Criada a pasta `selolibertaria-store/docs/prompts/fastapi-bff-migration/`.
- Registrado um prompt mestre e quatro prompts sequenciais para governança,
  cutover PostgreSQL, frontend BFF, OAuth/jobs/Mercado Pago e validação integrada.
- Adicionado metaprompt de implementação do incidente Mercado Pago DEV-164,
  com slices de diagnóstico 401, criação idempotente, webhook/reconciliação e
  homologação Sandbox.
- Slice 1: FastAPI passou a distinguir configuração/401/403/timeout Mercado
  Pago de erro de validação, com resposta sanitizada, readiness local e testes.
- Slice 2: tentativas Mercado Pago agora são persistidas por chave de
  idempotência antes da chamada externa; a cadeia Alembic foi corrigida e a
  migration de tentativas foi gerada e validada em SQLite temporário.
- Slice 3A: webhook Mercado Pago passou a deduplicar recibos por `event_id` e
  finalizar o checkout pelo mesmo serviço de reconciliação.
- Slice 3B: adicionada uma entrada de job executável no backend para a
  reconciliação Mercado Pago; o cron Next foi mantido como contingência até
  haver evidência de agendamento real no ambiente-alvo.
- Slice 3C: o Compose do backend agora declara um worker de reconciliação
  periódico e a imagem inclui os scripts necessários; a validação se limita ao
  render do Compose, sem execução de containers ou chamada ao provedor.
- Documentação de migração alinhada ao estado atual do webhook idempotente,
  retry/backoff e worker Compose; a homologação Sandbox permanece pendente.
- Slice 3D: a finalização passou a rejeitar retorno do provider com moeda
  divergente do draft, antes de persistir qualquer transição financeira.
- Slice 3E: reconciliações agora usam lease persistido por Order externa e
  registram o alcance do limite de tentativas como alerta terminal.
- OAuth Slice 1: FastAPI passou a persistir state/PKCE e ticket de conclusão
  de uso único; a migração do BFF Next será validada separadamente.
- OAuth Slice 2: BFF Next delega o início ao FastAPI e consome somente o
  ticket de conclusão para emitir o cookie de sessão.
- Prompt 03: adicionada a matriz adversarial de OAuth no backend
  (`backend/tests/test_oauth.py`, 11 casos): replay de state e de ticket,
  state inválido/de outro provedor, provedor desativado/desconhecido, redirect
  derivada no servidor, falha de callback sem emissão de ticket, conta
  duplicada reconciliada e conta bloqueada. Suíte backend: 57 passam.
- Prompt 03: confirmado que cancelamento/estorno já vivem no FastAPI
  (`POST /orders/{id}/payment-operation`, guarda de estado + auditoria) e que
  cartões salvos estão explicitamente desabilitados no Next
  (`checkout-actions.ts`); permanecem como issue própria.
- Prompt 04 (parcial): `alembic upgrade head` aplicado em PostgreSQL 16
  (`alembic current` = `924f7cf48285 (head)`); `auth/register` + `auth/login`
  exercitados contra esse banco; frontend `vitest` (137) e `tsc --noEmit`
  limpos. NO-GO registrado para homologação Sandbox Mercado Pago, migração
  Mongo→PostgreSQL real, agendamento do worker no ambiente-alvo e smoke E2E
  no browser — todos dependem de credenciais/ambiente não disponíveis aqui.
- `docs/architecture/fastapi-migration-map.md` reescrito para o estado real:
  frontend sem Mongo, superfícies migradas e pendências de GO isoladas.
