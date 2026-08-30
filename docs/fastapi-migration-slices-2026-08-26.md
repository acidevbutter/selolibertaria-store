# Slices FastAPI — 2026-08-26

## Slice P0 — remover relay público de e-mail

Prompt aplicado:

> Remova o endpoint público `/api/_test/send-email` do Next. Nenhuma rota pública pode aceitar destinatário, assunto e corpo e então usar `FASTAPI_INTERNAL_API_KEY` para enviar e-mail. Preserve o envio transacional interno já existente.

Resultado:

- `src/app/api/_test/send-email/route.ts` removido.
- `src/lib/email.ts` preservado para fluxos server-only autorizados.
- O endpoint FastAPI `/communications/send` continua protegido por chave interna.

## Slice P1 — webhook Mercado Pago direto no FastAPI

Prompt aplicado:

> Remova o relay Next de `/api/mercado-pago/webhook`. O Mercado Pago deve chamar diretamente `POST /payments/mercado-pago/webhook` no FastAPI, que valida assinatura e persiste o evento. Atualize o diagrama sem afirmar que OAuth já foi migrado.

Resultado:

- `src/app/api/mercado-pago/webhook/route.ts` removido.
- A exceção de autenticação pública dessa rota foi removida do `src/proxy.ts`.
- O diagrama mostra Mercado Pago → FastAPI diretamente.
- OAuth permanece marcado como pendente: state/PKCE e callback ainda passam pelo Next.

Limites e operação:

- Não alterei `asaas_payment`.
- Não restaurei o submódulo `backend` marcado como `D`; existe um checkout FastAPI separado, mas restaurar o gitlink seria uma alteração de estado não solicitada para estas slices.
- O endpoint público configurado no Mercado Pago deve ser a URL de deployment do FastAPI seguida de `/payments/mercado-pago/webhook`.
