# Editor editorial — incidente de 2026-09-30

Relato da dona do site ao entrar no admin: a página editorial "não funciona", parágrafo escrevendo ao contrário,
imagem não sobe ("Chave interna inválida"), rascunho não salva (401), o "+" não fecha ao clicar fora e a lista de opções
deveria ser centralizada e rolável, e nenhum editorial/rascunho já salvo aparecia.

## Resumo das causas

| # | Sintoma | Causa | Onde foi resolvido |
|---|---------|-------|--------------------|
| 1 | Texto ao contrário | Campos `contentEditable` controlados pelo React: a cada tecla o React reescrevia o nó de texto e o cursor voltava ao início | Código — store (#199, PR #204) |
| 2 | "+" não fecha; lista mal posicionada | Popover ancorado no bloco, sem backdrop, sem Esc, sem rolagem | Código — store (#200, PR #204) |
| 3 | 401 no rascunho / "Chave interna inválida" no upload | **Em produção** `FASTAPI_INTERNAL_API_KEY` da store (25 caracteres) ≠ `INTERNAL_API_KEY` do backend (64) | **Infra** (#202) — não é código |
| 4 | Editoriais/rascunhos "sumidos" | (a) o 401 acima era engolido e a página abria vazia/mock; (b) produção **não tem nenhum registro editorial** | Código: erro explícito (#201, PR #204); Backend: rascunho cria a página (backend#85, PR backend#86); Dados: rodar o seed (#203) |

> Importante: o que a dona testou foi **produção** (`selolibertaria.com.br`), não o preprod. Preprod está saudável
> (chaves iguais, as 9 páginas com rascunho e publicado).

## Evidência (servidor `srv1962123`, 2026-09-30, somente leitura)

- Logs do backend de produção (`selolibertaria-api`): `PUT /editorial/internal/admin/{type}/{slug}/draft → 401`
  às 06:06–06:07 UTC, e `GET /promotions/active → 401` a cada ~30 s (a store também usa a chave interna aí).
- Comparação por hash (sha256, sem expor valores):

  | Serviço | Variável | Tamanho | sha256[:8] |
  |---------|----------|---------|-----------|
  | web preprod | `FASTAPI_INTERNAL_API_KEY` | 64 | 9f6bb217 |
  | api preprod | `INTERNAL_API_KEY` | 64 | 9f6bb217 |
  | worker preprod | `INTERNAL_API_KEY` | 64 | 9f6bb217 |
  | api staging | `INTERNAL_API_KEY` | 64 | dc262f9c |
  | api produção | `INTERNAL_API_KEY` | 64 | 9f6bb217 |
  | worker produção | `INTERNAL_API_KEY` | 64 | 9f6bb217 |
  | worker-prod (2º) | `INTERNAL_API_KEY` | 64 | dc262f9c |
  | **web produção** | `FASTAPI_INTERNAL_API_KEY` | **25** | **a8331294** |

  Pontos de atenção: (i) a store de produção não bate com nenhum backend; (ii) preprod e produção **compartilham a
  mesma chave** (`9f6bb217`) — devem ser distintas; (iii) há um worker de produção com a chave do staging.
- Preprod, chamada real de dentro da store: `GET /health` 200 e `GET /editorial/internal/admin/page_home` 200 com
  `draft_doc`/`published_doc` (13 blocos).
- Produção, `GET /editorial/internal/admin/{tipo}` para as 9 páginas: `[]` em todas.
- Versões no ar: produção store `9d12719` (20/09) + api `ba35b96` (20/09); preprod store `ea684bf` + api `6aae731`
  (master de 28/09).

## O que mudou no código

### Store (PR #204)
- `editorial-editable-text.client.tsx` — `EditableText`: o React só renderiza o texto inicial; depois o DOM pertence ao
  navegador e o valor só é empurrado quando difere do que já está lá (undo/redo, atalhos, marcas). Usado em parágrafo,
  título, citação, destaque, itens de lista, legenda e crédito.
- `editorial-blocks-editor.client.tsx` + `ad-oficina.css` — seletor de blocos vira modal (`.ad-scrim.ad-scrim-center` +
  `.ad-popover-modal`): centralizado, lista com rolagem própria (`.ad-popover-results`), fecha por backdrop / Esc /
  escolha, setas ↑↓ + Enter, "Nenhum tipo encontrado".
- `blocks-actions.ts` — `loadEditorialBlocksRecord` retorna `ok | missing | error`; 401/403/5xx nunca viram "página
  vazia". Checa sessão + capability `editorial.write`. Mensagens acionáveis em rascunho/publicação.
- `blocos/[slug]/page.tsx` — painel de erro com "Tentar de novo" (o editor não abre para não sobrescrever conteúdo).
- `editorial/page.tsx` + `editorial-admin-api.ts` (`probeEditorialBackend`) — aviso na lista de páginas quando o backend
  recusa a chave.
- `editorial-backend-errors.ts`, `media-upload.ts` — 401 vira "o servidor recusou a chave interna…" (com os nomes das
  variáveis), em vez de "Chave interna inválida" cru.

### Backend (PR backend#86, issue backend#85)
- `EditorialService.save_draft` cria a página (não publicada, `title = slug`, ordem 0) na primeira vez, só para as 9
  páginas do editor de blocos. Qualquer outro tipo continua 404. Sem migration.

## Ações de infraestrutura pendentes (dependem do dono)

1. **Produção — igualar a chave** (#202): definir uma `INTERNAL_API_KEY` **nova e exclusiva de produção** (64 hex),
   copiada igual para `selolibertaria-api`, os workers de produção e `FASTAPI_INTERNAL_API_KEY` da store; redeploy dos
   três. Gerar outra para preprod (hoje é a mesma). Não colar segredos em issues/chat.
2. **Produção — dados** (#203): depois do deploy do backend com o PR #86, rodar
   `docker exec <api-prod> python scripts/seed_editorial_blocks.py` (idempotente; escreve rascunho **e** publicado a
   partir do conteúdo vivo hoje). Alternativa sem seed: abrir cada página no editor e Publicar.
3. Deploy da store/backend de produção com estes PRs (produção ainda roda builds de 20/09).

## Verificação

- Store: `vitest` 165 passando; `tsc --noEmit` e `biome check` limpos. Navegador real: texto digitado sai na ordem
  correta (estado == DOM) e o modal abre centralizado (centro 512×384 em 1024×768) com lista rolável.
  Fechar por clique fora/Esc/escolha está coberto por testes (jsdom), não foi refeito no navegador.
- Backend: `ruff`, `mypy` ok; `pytest` 227 passando (`SITE_ACTIVATION_FORCE_ACTIVATED=false`; com o `.env` local, 5 testes
  de site-activation falham — issue backend#83, corrigida no PR backend#84).
- Não foi possível abrir o editor autenticado localmente: gerar/injetar uma sessão de admin foi bloqueado pelo
  classificador de permissões, então a verificação visual usou uma página temporária (removida) fora do `/admin`.
