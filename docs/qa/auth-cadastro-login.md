# Runbook QA — Fluxo feliz: Cadastro e login do cliente

- Data do teste: 2026-09-08
- Ambiente: local (`yarn dev` :3001, backend FastAPI :9001)

## Passo a passo testado

1. `/login` → carrega ok, formulário de "Entrar".
2. Clicar "Não tem uma conta? Cadastre-se" → alterna para o wizard de cadastro (mesma página, sem navegação de rota), passo **1 de 3**.
3. Passo 1 (Identificação): nome, e-mail, telefone, senha, confirmar senha → "Continuar".
4. Passo 2 (Endereço): mesmo componente de endereço do checkout (`address-fields.client.tsx`).
   - Validação funciona: tentar avançar sem endereço mostra "Preencha seu endereço." e não deixa passar.
   - Sofre do mesmo **Bug #2** já documentado em [checkout-compra-loja.md](checkout-compra-loja.md) (autofill de CEP sempre "indisponível"). Preenchimento manual funciona normalmente.
5. Passo 3 (Preferências): moeda preferida + opt-in de alertas de promoção → "Criar conta".
6. Resultado: **"Cadastro pendente"** — tela final avisa que é preciso verificar o e-mail para confirmar o cadastro, com o e-mail informado exibido de volta. Backend confirma `POST /auth/register -> 201`.

## Observações (não necessariamente bugs)

- A mensagem final diz "Verifique seu e-mail para confirmar seu cadastro **e concluir o pagamento**." — a menção a "pagamento" é estranha num cadastro que não partiu de um checkout (o usuário não estava comprando nada). Pode ser copy reaproveitada do fluxo "criar conta durante o checkout" aplicada indevidamente ao cadastro avulso. Vale confirmar com o time de produto se é intencional.
- Não foi possível concluir a verificação de e-mail neste teste (sem acesso à caixa de entrada/provedor de e-mail do ambiente local), então **login pós-cadastro não foi validado ponta a ponta**. Recomendo, numa próxima rodada, checar se há um capturador de e-mail local (Mailhog/Mailpit) ou uma rota de dev para obter o link de verificação.

## Login administrativo — bloqueio de ambiente encontrado e corrigido

- `.env` do projeto declara `ADMIN_EMAIL=contact@selolibertaria.com` / `ADMIN_PASSWORD=Senh@1234`, mas o container do backend não recebe `ADMIN_EMAIL`/`ADMIN_PASSWORD` (variáveis vazias dentro do container). O script `backend/scripts/create_admin.py` nunca é chamado automaticamente (nem no `Dockerfile`, nem no `docker-compose`, nem em migração Alembic) — por isso o login com as credenciais do `.env` sempre retornava 401.
- Rodando manualmente `docker exec selolibertaria-backend-api python scripts/create_admin.py --reset-password`, o script criou/promoveu o admin com um e-mail **diferente do `.env`**: `contato@selolibertaria.com.br` (o `.env` diz `contact@selolibertaria.com` — domínios e grafias diferentes). Com esse e-mail e a senha `Senh@1234`, o login funciona (`200`, `role: admin`).
- **Ação sugerida**: (a) corrigir a divergência entre o e-mail hardcoded/fallback do `create_admin.py` e o `ADMIN_EMAIL` do `.env.example`, para não confundir quem for configurar o ambiente do zero; (b) considerar chamar `create_admin.py` automaticamente no bootstrap do container (ou documentar claramente esse passo manual no README de setup), já que sem ele nenhuma conta admin existe no banco.

## Não testado ainda
- Verificação de e-mail e primeiro login do cliente recém-cadastrado.
- "Esqueceu sua senha?" (recuperação de senha) — só localizamos o botão, não executamos o fluxo.
- Login social/OAuth (`/api/auth/oauth/[provider]`).
