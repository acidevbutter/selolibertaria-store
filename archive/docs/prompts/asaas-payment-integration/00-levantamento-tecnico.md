# 00 — Levantamento técnico: integração Asaas DevButter ↔ Selolibertaria

Consolidado em 2026-08-28 a partir do código e docs dos dois repositórios (`devbutter_app`, `selolibertaria`) e da documentação oficial da Asaas (MCP `asaas`). Este documento é a base factual para o ADR (`01`), o desenho de sistema (`02`) e os diagramas em `diagrams/`.

## A. O que já existe hoje (AS-IS)

### `devbutter_app/asaas_payment` (proxy mTLS, único detentor da API key raiz Asaas)
FastAPI + nginx. Clientes autenticam por certificado mTLS (CN validado contra `ALLOWED_CLIENT_CNS` / `ADMIN_CLIENT_CNS`). Rotas relevantes:
- `POST /subaccounts` → `POST /v3/accounts` na Asaas. Retorna a resposta **sem** a `apiKey` (`hide_api_key=True`); a key vem da Asaas, é criptografada (Fernet, `FIELD_ENCRYPTION_KEY`) e persistida em `subaccounts.encrypted_api_key`.
- `GET/DELETE /subaccounts/{id}`, `POST /subaccounts/{id}/resend-activation-link`.
- `POST/GET/PUT/DELETE /subaccounts/{id}/access-tokens[...]` → espelha `/v3/accounts/{id}/accessTokens`. Persistido em `access_tokens` (`encrypted_token`, `enabled`, `expiration_date`, `revoked_at`).
- `/subaccounts/{id}/customers|payments|checkouts|onboarding/...` (domínio `ecommerce`).
- `/subaccounts/{id}/split-rules` (domínio próprio do proxy — Asaas não tem "regra de split" persistente, só valor por cobrança).
- `/internal/payment-methods/{tokenize,pay}` (tokenização de cartão, CN-gated por `PAYMENT_CLIENT_CNS`).
- `/audit/...` — log assinado (HMAC) de toda chamada, sem PII.
- **Não existe receptor de webhook neste serviço** — limitação documentada no próprio README do `asaas_payment`.

Modelos-chave: `Subaccount(id, client_id, wallet_id, encrypted_api_key, created_at, closed_at)`; `AccessToken(id, account_id, client_id, name, encrypted_token, enabled, expiration_date, revoked_at)`; `SplitRule`; `AuditLog`.

Decisão de arquitetura já registrada em `asaas_payment/plano-integracao-asaas-payment.md`: **uma instância do proxy por produto/projeto** (própria API key raiz, próprio Postgres, próprio CA) — não uma instância compartilhada. Isso importa para o desenho novo: Selolibertaria não deveria autenticar como um "client CN" a mais nesse mesmo `asaas_payment` do DevButter sem revisitar essa decisão (ver ADR).

### `devbutter_app/devbutter_backend` (orquestrador, cliente do `asaas_payment`)
- `app/core/clients/asaas_client.py`: cliente mTLS para o `asaas_payment` (não fala direto com a Asaas). Cobre Layer A (`create_customer`, `create_payment` na conta raiz do DevButter) e Layer B (subcontas, access tokens, split rules, pagamentos, audit).
- `app/webhooks/router.py`: `POST /webhooks/asaas` — recebe webhook **direto da Asaas** (não passa pelo proxy), valida header `asaas-access-token` com `!=` (comparação **não constante no tempo** — achado a corrigir, ver `03`), grava `WebhookEvent` e atualiza `Invoice` de forma idempotente.
- `app/accounts/models.py`: `AsaasCustomerLink` (Layer A) e `AsaasSubaccountLink` (Layer B: `company_id`, `asaas_account_id`, `wallet_id`, `onboarding_status`, `approval_status`, `split_quota_percent`).
- `app/admin/payments_router.py`: rotas admin (`/admin/subaccounts...`) para operar subcontas/tokens/splits, gated por `CurrentAdminAccount`.

**Não existe hoje nenhuma rota, cliente ou webhook conectando `devbutter_backend` ao backend do Selolibertaria.** Esse é o gap central que esta série de prompts fecha.

### `selolibertaria/backend`
Zero código Asaas. Pagamento hoje é 100% Mercado Pago: `app/payments/{router,service,mercado_pago_client}.py`, prefixo `/payments/mercado-pago`, webhook valida `x-signature` via HMAC com `hmac.compare_digest` (comparação correta — ao contrário do webhook Asaas do `devbutter_backend`). `app/payments/models.py` é um stub de uma linha: *"Payment records currently reuse order drafts and reconciliation tables"* — não existe tabela `Payment` dedicada ainda. Não existe `backend/docs/`. `.env.example` só tem `MERCADO_PAGO_*`, nenhuma variável `ASAAS_*`.

## B. Regras da Asaas relevantes para o desenho novo (fonte: docs.asaas.com, consultado via MCP)

1. **Criação de subconta é exclusiva para CNPJ.** Resoluções Conjuntas 16/17 do Banco Central: conta pessoa física (CPF) não pode criar subconta via API. *Item a validar com o time de negócio: todo cliente DevButter que vira subconta é CNPJ?*
2. **A `apiKey` da subconta só é retornada uma vez**, na criação (`POST /v3/accounts`) ou na criação de um novo access token (`POST /v3/accounts/{id}/accessTokens`). Não há endpoint para reconsultar a chave em texto claro depois — só rotacionar (gerar nova) ou revogar.
3. **Gerenciar (listar/criar/atualizar/revogar) access tokens de uma subconta pela conta raiz exige um passo manual**: habilitar acesso na interface web da Asaas, válido por **apenas 2 horas**, e exige IP Whitelist habilitado. **Isso não é automatizável de ponta a ponta sem esse passo humano/manual — é o maior risco operacional do fluxo de rotação e deve ser tratado como item urgente (ver seção D).**
4. **Não existe evento de webhook nativo da Asaas para "chave de API expirada/inválida".** A Asaas não empurra notificação alguma sobre o ciclo de vida de access tokens de subconta. Rotação e invalidação de chave são **responsabilidade 100% da aplicação** (DevButter): ou reage a um 401 da Asaas, ou controla proativamente por `expiration_date` armazenado localmente (campo que já existe em `AccessToken`, mas nem sempre é setado hoje). O "webhook" pedido pelo usuário para "atualizar a chave quando vencer ou ficar inválida" **tem que ser um webhook nosso** (DevButter → Selolibertaria), não algo que a Asaas dispara.
5. **Webhooks de conta existem** para status de onboarding/documentação: `ACCOUNT_STATUS_{BANK_ACCOUNT_INFO,COMMERCIAL_INFO,DOCUMENT,GENERAL_APPROVAL}_{APPROVED,AWAITING_APPROVAL,PENDING,REJECTED}`, mais `ACCOUNT_STATUS_COMMERCIAL_INFO_{EXPIRING_SOON,EXPIRED}` (confirmação anual de dados cadastrais — outro gatilho que pode invalidar a operação da subconta e merece tratamento).
6. **Webhooks de pagamento**: conjunto amplo de eventos (`PAYMENT_CREATED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_*`, `PAYMENT_SPLIT_*`, etc.) — necessários para o backend do Selolibertaria reconciliar pedidos quando ele passar a falar direto com a Asaas.
7. **Entrega "at least once"**: eventos podem repetir; idempotência obrigatória via campo `id` do evento; responder rápido com 200 e processar assíncrono; eventos ficam disponíveis por 14 dias; o payload pode ganhar campos novos — o consumidor não pode quebrar com campos desconhecidos.
8. **Contas novas criadas via API entram em período de avaliação regulatória**, com possíveis limites operacionais — relevante para dimensionar o piloto.

## C. Lacunas explícitas encontradas no código/docs existentes

1. `asaas_payment` não recebe webhook — decisão de receber direto no `devbutter_backend` foi tomada na prática mas não está retro-documentada no próprio `asaas_payment` (`plano-admin-asaas-integracao.md §2.6` já sinalizava isso).
2. `asaas_payment` não suporta passthrough multipart — bloqueia upload de documento de onboarding via proxy.
3. `TODO(infra)` não confirmado: o CN do `devbutter_backend` precisa estar em `ADMIN_CLIENT_CNS` do `asaas_payment`, senão toda chamada admin (incluindo rotação de token) recebe 403.
4. Comparação do header `asaas-access-token` em `devbutter_backend/app/webhooks/router.py` usa `!=` (não é constant-time) — risco de timing attack, ainda que baixo. Selolibertaria já faz certo com `hmac.compare_digest`; usar o mesmo padrão no novo webhook.
5. Iniciativa de tokenização de cartão (`docs/prompts/payment-tokenization/`) está com **NO-GO** registrado na última validação (2026-08-24) — bloqueadores: integração BFF, anti-replay atômico, ownership, token-at-rest, sandbox Asaas real. Não depender dela como pré-requisito bloqueante desta série; tratar como paralela.
6. Selolibertaria não tem `Payment` model dedicado — precisa ser criado (ver `02`), não só "adaptar" o que existe.

## D. Itens urgentes a resolver antes/durante a implementação (ordenados por risco)

1. **[Bloqueador operacional]** Confirmar com a Asaas (suporte comercial) se existe forma de manter o acesso aos endpoints de gerenciamento de token de subconta (`/v3/accounts/{id}/accessTokens`) habilitado permanentemente para uma conta parceira/parent, ou se o time terá que operar a janela manual de 2h por IP Whitelist a cada rotação. Isso decide se a rotação pode ser 100% automática ou exige intervenção humana agendada.
2. **[Bloqueador de compliance]** Confirmar que 100% dos clientes que vão virar subconta são CNPJ (Asaas bloqueia CPF na criação via API). Se houver clientes pessoa física, o fluxo de onboarding precisa de um caminho alternativo (conta comum sem subconta, ou Layer A apenas).
3. **[Segurança]** Definir o mecanismo de assinatura/transporte da rota específica DevButter→Selolibertaria que carrega a `apiKey`/token da subconta (não existe hoje): mTLS (replicando o padrão do `asaas_payment`) vs. HMAC assinado + TLS simples. Ver ADR `01`.
4. **[Infra]** Registrar o CN/identidade do `devbutter_backend` em `ADMIN_CLIENT_CNS` do `asaas_payment` (pré-requisito já pendente, item 3 da seção C) e decidir a identidade equivalente para a chamada DevButter→Selolibertaria (novo client id/CN a emitir).
5. **[Produto]** Decidir se a integração Asaas **substitui** o Mercado Pago no Selolibertaria ou **coexiste** (multi-provider). O pedido do usuário não deixa isso explícito; o desenho em `02` assume coexistência (feature-flag por conta) até confirmação — ver "Questões em aberto" no ADR.
6. **[Segurança]** Corrigir a comparação não constante no tempo do webhook Asaas em `devbutter_backend` como parte do trabalho de `03` (achado B4), já que o mesmo padrão de header (`asaas-access-token`) será reusado no novo webhook de pagamento do Selolibertaria.
7. **[Operacional]** Monitorar `ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRING_SOON/EXPIRED` (confirmação anual de dados cadastrais) — se isso não for tratado, uma subconta ativa pode parar de processar pagamento sem que nenhuma "chave" tenha tecnicamente vencido; deve alimentar o mesmo webhook de rotação/alerta descrito no fluxo novo.
8. **[Alcance]** Definir ambiente de testes: tudo deve rodar contra **sandbox Asaas** até o item 1 e uma revisão de segurança (`06`) serem concluídos — nenhuma fatia de implementação deve tocar produção antes disso.
