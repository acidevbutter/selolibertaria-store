# Runbook QA — Consistência visual: Admin dashboard, badges de status, tabela e sidebar

- Data do teste: 2026-09-13
- Origem: auditoria de design do Canvas Admin Selo Libertária (Claude Design) comparada linha a linha contra o código real deste repositório — feita porque o próprio sistema de design (`readme.md` do projeto Claude Design) registra que a pasta `selolibertaria-store` estava desconectada no momento em que o canvas foi montado, então nem todo achado do canvas necessariamente reproduz aqui. Cada item abaixo foi conferido no código antes de virar bug.
- Ambiente: leitura estática do código (não executado em runtime nesta rodada).

## Bugs encontrados

### Bug #6 — Valores numéricos do dashboard admin sem a fonte de números (DCC Ash / `.price-font`)

- **Observado**: `src/app/globals.css` documenta explicitamente a regra do sistema — "Two faces only: Fertigo (`--font-editorial-body`) for headings + body, DCCAsh (`--font-editorial-display`) for prices/numbers/accents" — e define a classe `.price-font` para isso. O dashboard admin (`src/app/admin/page.tsx`) não aplica essa classe nos valores numéricos:
  - `formatMoneyList` (linhas 44 e 51): `<div className="text-4xl font-semibold tracking-tight">` — sem `price-font`.
  - `StatCard` (linha 158): `<div className="mt-3 text-4xl font-semibold tracking-tight">{value}</div>` — mesmo padrão, sem `price-font`.
- **Causa raiz**: as duas funções usam só utilitários de tamanho/peso do Tailwind, nunca a classe `price-font` já definida no projeto para exatamente este caso de uso.
- **Impacto**: receita, contagem de pedidos e demais números do dashboard renderizam na fonte de corpo/headline (Fertigo) em vez da fonte de números (DCC Ash) — quebra a regra tipográfica mais explícita do sistema (o comentário em `globals.css` já nomeia esse par como a distinção central do sistema de tipos).
- **Correção sugerida**: adicionar `price-font` à className de `formatMoneyList` (ambas as ocorrências) e de `StatCard`. Conferir também `QueueMetric` e qualquer outro componente do dashboard que renderize número bruto.

### Bug #7 — `StatusBadge` usa paleta padrão do Tailwind em vez dos tokens editoriais

- **Observado**: `src/ui/status-badge.tsx`, linhas 31–39 — os badges de status usam `bg-emerald-100/text-emerald-800` (pago/processado/enviado/concluído/resolvido), `bg-orange-100/text-orange-800` (disputado), `bg-red-100/text-red-800` (falha/perdido), `bg-amber-100/text-amber-800` (pendente/processando), `bg-gray-200/text-gray-800` (cancelado) — nenhuma dessas cores é um token do sistema de marca.
- **Causa raiz**: componente implementado com classes de cor Tailwind soltas, sem referência às variáveis editoriais (`--editorial-accent` / vinho, `--editorial-ink`, etc.) usadas no resto do admin.
- **Impacto**: `StatusBadge` é usado em qualquer lugar que mostre status de pedido/pagamento (dashboard, `/admin/orders`, provavelmente `/admin/users`) — a inconsistência se propaga para toda tela que reutiliza o componente, não só o dashboard.
- **Correção sugerida**: mapear os estados semânticos para os tokens editoriais existentes (ex.: pago → vinho/`--editorial-accent` sobre fundo neutro; falha/perdido → mesmo vinho sobre a "lavagem" de erro do sistema, não vermelho de sistema; pendente/processando → tom neutro do sistema; cancelado → cinza-tinta em opacidade, nunca `gray-200` de biblioteca).

### Bug #8 — Tabela padrão (`shadcn/table`) usa cinza de biblioteca em vez de tinta em opacidade

- **Observado**: `src/ui/shadcn/table.tsx` — `TableHeader` (linha 16) e `TableRow` (linha 43) usam `border-b`/`hover:bg-muted/50`/`data-[state=selected]:bg-muted`; `TableFooter` (linha 32) usa `border-t bg-muted/50`. Todos herdam a cor cinza padrão do tema shadcn, não uma variável editorial.
- **Causa raiz**: é o primitive genérico do shadcn, nunca costurado às variáveis de borda do projeto (as mesmas usadas em `login-form.tsx`, por exemplo, via `--editorial-border`).
- **Impacto**: qualquer tabela do admin que use este componente (pedidos, produtos, usuários) herda filete e hover em cinza de biblioteca — mesmo problema que a auditoria do canvas de design já tinha identificado no dashboard, só que aqui a causa é um componente compartilhado, não uma tela isolada.
- **Correção sugerida**: trocar `border-b`/`border-t`/`bg-muted` por `border-[color:var(--editorial-border)]` e um tom de hover derivado da tinta em opacidade, consistente com o restante do admin.

### Bug #9 — Sidebar do admin: logo com raio e item de navegação "ativo" com fundo suave em vez de bloco sólido

- **Observado**: `src/app/admin/_components/sidebar.client.tsx`:
  - Linha 22 — `AdminBrandMark`: `"grid shrink-0 place-items-center overflow-hidden rounded-xl bg-[#fffdf8] ring-1 ring-white/8"`.
  - Linhas 97–99 — item de navegação ativo: `"flex w-full items-center gap-3 rounded-xl px-3 py-3..."` com `active ? "bg-[#f7f1e8] text-[#0b0b0b]" : ...`.
- **Causa raiz**: sidebar não segue a regra de raio zero do restante do editorial (visível em `login-form.tsx`, que usa `rounded-none` consistentemente), e usa preenchimento suave em vez de bloco sólido para indicar seleção.
- **Impacto**: é a única superfície do admin com esse padrão — o resto do admin (campos de login, botões) já usa cantos retos. Isso pode ser intencional (decisão de marca para a sidebar) ou herança não revisada; hoje não há nenhum comentário no código que diga qual dos dois é.
- **Correção sugerida**: se for para zerar o raio, trocar `rounded-xl` por `rounded-none` nas duas ocorrências e o fundo do item ativo por um bloco sólido (preto ou vinho) com texto claro. Se a equipe decidir manter o raio como exceção deliberada da área logada, documentar isso em algum lugar do repositório (ex. `docs/design/UI_UX_PATTERNS.md`) para não parecer herança acidental da próxima vez que alguém auditar.

## Achados do canvas de design (Claude Design) que NÃO reproduzem no código real — verificado

O canvas "Canvas Admin Selo Libertaria.dc.html" (projeto Claude Design) foi montado sem acesso a este repositório (registrado no próprio `readme.md` do sistema de design: "pasta estava desconectada... nenhum valor foi lido do código"). Ao conferir os achados desse canvas contra o código real, os itens abaixo **não se aplicam** — o código já está correto ou melhor do que o canvas mostrava:

- **Altura de campo/botão de login abaixo de 44px**: não confirmado. `src/ui/login-form.tsx` usa `h-12` (48px) em campos e botão de submit, `OAuthButtons` usa `h-11` (44px) — dentro do mínimo do sistema.
- **Ícone do Google trocado por Instagram**: não confirmado. `src/ui/auth/oauth-buttons.tsx` mapeia corretamente `google → google.svg`, `facebook → facebook.svg`, `instagram → instagram.svg`. O provedor "Instagram" é uma opção de login real e intencional deste produto (`src/lib/oauth/catalog.ts`), não um ícone errado.
- **Ausência de estado de erro no login**: não confirmado. `login-form.tsx` já renderiza mensagem de erro tanto para falha de OAuth (`oauthError`) quanto para credenciais inválidas (`loginError`), e tem fluxo de "esqueci minha senha".

Manter este registro evita que alguém re-abra esses três itens como bug no futuro sem checar o código primeiro.
