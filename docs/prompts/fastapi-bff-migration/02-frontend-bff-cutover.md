# Prompt 02 — frontend: BFF fino e consumo exclusivo do FastAPI

Leia os prompts 00 e 01. Trabalhe somente em
`/Users/marcospereira/development/selolibertaria/selolibertaria-store`.

## Objetivo

Manter o Next.js apenas como BFF/apresentação, sem persistência ou integração
externa de negócio.

## Checklist de conversão

- Cada Server Action e Route Handler deve chamar um client server-only do
  FastAPI, com timeout, `cache: no-store` quando necessário e tradução segura
  de erros.
- Cookies de sessão continuam `httpOnly`, `secure` em produção, `sameSite`
  adequado e nunca são expostos ao JavaScript do browser.
- Remover qualquer leitura/escrita direta de MongoDB, filesystem de negócio,
  SDK privado ou provider externo no Next.
- O browser nunca recebe `FASTAPI_INTERNAL_API_KEY`, access token de Mercado
  Pago, segredo OAuth, credencial de frete ou credencial Relay.
- Preservar URLs, UX, i18n, permissões e contratos públicos existentes.
- Route Handlers administrativos devem validar sessão/capability e repassar
  somente a requisição necessária ao FastAPI.
- Checkout deve enviar ao backend o snapshot validado, preço/frete, comprador,
  idempotency key e chave privada do draft conforme o contrato FastAPI.

## Superfícies obrigatórias

Auth/sessão, catálogo, categorias, carrinho, checkout, pedidos, promoções,
editorial, settings, favoritos, mídia, comunicações, frete, webhooks, admin e
cron. Para cada superfície, registre endpoint FastAPI, método, headers,
payload, resposta e teste de contrato.

## OAuth

Enquanto o prompt 03 não for concluído, mantenha state/PKCE/callback no Next,
mas não persista identidade nem troque código diretamente no frontend. Marque
essa exceção de forma explícita nos documentos e testes.

## Critérios de aceite

- Busca estática não encontra import de MongoDB, `getDb` ou `ensureIndexes` em
  código ativo do frontend.
- Não existem relays públicos que aceitem dados arbitrários e usem chave
  interna.
- Todos os BFFs têm autenticação, timeout, tratamento de erro e teste.
- Build, lint, typecheck e testes do frontend passam.
- Reload direto, login, catálogo, carrinho, checkout e admin continuam
  funcionais contra FastAPI real.

Não alterar `asaas_payment` nem implementar domínio no Next para contornar
endpoint ausente; bloquear e registrar o contrato faltante.
