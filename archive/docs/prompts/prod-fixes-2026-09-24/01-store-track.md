# 01 — Corrigir bugs de produção detectados: store

**Repositório alvo:** `selolibertaria-store`, em `.worktrees/prod-fixes-store` (branch
nova a partir de `staging`, porta de dev dedicada, ex. 3006).

## Escopo

Corrigir, uma por vez, com commit e teste próprios para cada issue:

1. **acidevbutter/selolibertaria-store#61** — falta `output: "standalone"` no
   `next.config` (build do Coolify falha sem isso). Adicionar a opção, conferir se o
   Dockerfile já copia `.next/standalone` + `.next/static` + `public` corretamente.

2. **acidevbutter/selolibertaria-store#63** e **#65** — `yarn build` falha em CI porque
   `FASTAPI_INTERNAL_API_KEY` e `OAUTH_STATE_SECRET` não são fornecidos ao job `build` do
   workflow. Adicionar valores placeholder seguros (CI-only) em
   `.github/workflows/test.yml` para o job `build`.

3. **acidevbutter/selolibertaria-store#162** — o passo 2/3 do cadastro (`/login` →
   Cadastre-se) coleta endereço completo com autopreenchimento por CEP, mas
   `src/app/api/auth/register/route.ts` valida com um schema Zod que só aceita `email`,
   `password`, `name`, `phone`, `preferredCurrency` — o campo `address` (e `phoneDetails`,
   `marketing`) são descartados silenciosamente. Fazer o endereço ser persistido: expandir
   o schema Zod e, após criar a conta no FastAPI, chamar o endpoint que já aceita esses
   campos (`backend/app/users/schemas.py`) para salvar o endereço. Cobrir com teste que
   confirma que o endereço enviado no cadastro aparece no registro do usuário.

4. **acidevbutter/selolibertaria-store#163** — em
   `src/app/admin/products/_components/admin-image-url-list.client.tsx`, o upload
   instantâneo de imagem chama `containerRef.current?.closest("form")?.requestSubmit()`
   logo depois de `setValues(...)` (via `appendValue`), antes do React re-renderizar o
   input oculto com a nova URL — o form submete o valor antigo, a imagem nova nunca é
   salva, sem nenhum erro visível. Corrigir a race (ex.: `flushSync` em volta do
   `setValues` antes do `requestSubmit()`, ou submeter a server action diretamente com o
   valor em variável local em vez de reler o DOM). Cobrir com teste que faz upload
   instantâneo e confere que o valor persistido no backend é o novo.

5. **acidevbutter/selolibertaria-store#164** — a página de detalhe de evento/projeto no
   admin (`src/app/admin/editorial/events/[slug]/page.tsx` e o equivalente de
   `projects`) busca o registro via `getEditorialEventBySlug` →
   `getEditorialEventRecordBySlug` (`src/lib/editorial-content-store.ts`), que chama o
   endpoint **público** (só-publicado). Ao despublicar um evento pela própria página, ela
   deixa de encontrar o registro e redireciona o operador de volta pra lista. Trocar essas
   duas funções (usadas nas páginas de detalhe do *admin*) para consultar o endpoint admin
   (`listEditorialFromApi(type, admin=true)`), preservando o lookup público apenas nas
   páginas voltadas ao público (`/events`, `/projects`).

## Restrições

- Não tocar #158 (precisa seed em produção) nem #64/#90 (config Coolify) — fora de escopo.
- Rodar `yarn test`, `yarn lint`, `yarn tsc --noEmit` antes de cada commit — só commitar
  se os três passarem.
- Um commit por issue corrigida, mensagem referenciando o número da issue.
- Ao fechar uma issue no GitHub, usar
  `gh issue close <n> --repo acidevbutter/selolibertaria-store --comment "..."` explicando
  o que foi feito.

## Log de execução

Ao terminar (ou parar), faça APPEND (nunca sobrescreva) de um bloco abaixo:

### Executado — <data>

- Chat: codex-cli
- Modelo: <modelo>
- Issues corrigidas: <lista>
- Issues fechadas no GitHub: <lista>
- Bloqueios/decisões: <texto>

### Executado — 2026-09-24

- Chat: codex-cli
- Modelo: GPT-5
- Issues corrigidas: nenhuma
- Issues fechadas no GitHub: nenhuma
- Bloqueios/decisões: validação da #61 bloqueada antes dos testes porque `vitest` não está instalado; `yarn install --frozen-lockfile` falhou em `SecItemCopyMatching failed -50`. Nenhuma alteração foi commitada.

### Executado — 2026-09-24 (Claude, retomando após Codex travar no yarn install)

- Chat: claude-code
- Modelo: Sonnet 5
- Issues corrigidas: #162 (endereço no cadastro), #163 (race condition no upload de imagem), #164 (lookup público no detalhe do admin)
- Issues já resolvidas por trabalho anterior, fechadas sem mudança de código: #61 (Dockerfile já seta DOCKER=1), #63/#65 (workflow já tem env vars placeholder)
- Issues fechadas no GitHub: #61, #63, #65, #162, #163, #164 (todas)
- Commits: 5719c61 (#162 frontend), 66d95a3 (#163), c184ea1 (#164) na branch fix/prod-bugs-store-2026-09-24
- Bloqueios/decisões: Codex (gpt-5.6-terra) travou 100% no yarn install --frozen-lockfile com `SecItemCopyMatching failed -50` (erro de Keychain específico do sandbox do Codex, não reproduzido no Bash normal) — nada tocado por ele. Claude assumiu e implementou as 3 issues reais diretamente. Suíte completa (204 testes), lint e tsc passando.
