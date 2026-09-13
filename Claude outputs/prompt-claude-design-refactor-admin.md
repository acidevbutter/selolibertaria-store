# Prompt para o Claude Design — Improvement do Admin Selo Libertária

Use o Claude Design (comando `/design` ou o MCP `claude_design`) e cole o texto abaixo, anexando os arquivos indicados. Ele já está escrito para o Claude Design ler os documentos como fonte de verdade em vez de eu (ou ele) reconstruir os achados de memória — foi exatamente a falta disso que gerou o desalinhamento da primeira rodada (o canvas admin foi montado sem acesso ao código real).

---

## Prompt (copie a partir daqui)

Preciso que você evolua o **Canvas Admin Selo Libertária** (`Canvas Admin Selo Libertaria.dc.html`, projeto `https://claude.ai/design/p/51b9f903-a7c6-4eaa-9119-fff9c168518f`) com uma proposta de melhoria (correções pontuais de consistência, não uma reescrita) — não apenas o levantamento de estado atual que já existe. Antes de desenhar qualquer coisa, leia estes documentos, nesta ordem, e trate tudo neles como fonte de verdade (não invente achado novo sem verificar contra eles):

1. `claude/design-critique-canvas-admin.md` — a crítica original do canvas.
2. `claude/design-handoff-canvas-admin.md` — os tokens exatos e specs de componente para cada correção.
3. `claude/user-research-plan-canvas-admin.md` e `claude/research-synthesis-canvas-admin.md` — quais decisões ainda **não têm resposta** (dependem de pesquisa de campo que ainda não rodou).
4. `docs/qa/admin-dashboard-design-consistency.md` (no repositório `selolibertaria-store`) — **o mais importante dos cinco**: é a verificação desses achados contra o código real do Next.js. Ele confirma 4 bugs reais (Bug #6 a #9) com arquivo e linha exatos, e documenta 3 achados do canvas original que **não se aplicam** ao código de verdade (já estão corrigidos lá). Não redesenhe os três itens da seção "não reproduzem" desse documento — eles já estão certos no produto e desenhar uma "correção" para eles seria regressão, não melhoria.

### O que desenhar (baseado nos 4 bugs confirmados)

- **Dashboard — valores numéricos** (Bug #6): todo número (receita, contagem de pedidos, ticket médio) precisa usar a fonte de números do sistema (DCC Ash / classe `price-font` já existente no projeto), nunca a fonte de corpo/manchete. Mostre isso como comparação lado a lado "antes/depois" no artboard, não só como nota.
- **Badges de status** (Bug #7): pare de usar verde/laranja/vermelho/âmbar/cinza padrão de biblioteca. Desenhe a paleta correta usando só os tokens do sistema (`--sl-wine`/`--sl-accent`, `--sl-danger` + `--sl-danger-wash`, tons neutros de tinta em opacidade) — sem inventar uma cor "de sucesso" nova; o sistema não tem verde.
- **Tabela** (Bug #8): filete e hover em tinta-preta-em-opacidade, nunca cinza de biblioteca. Esse componente é compartilhado (pedidos, produtos, usuários) — desenhe a correção pensando nisso, não só na tela do dashboard.
- **Sidebar** (Bug #9): aqui eu quero **duas opções desenhadas lado a lado**, não uma decisão só sua — porque essa é justamente uma das perguntas que o plano de pesquisa ainda não respondeu (ver abaixo):
  - Opção A — raio zero (logo e item de navegação retos, IGUAL à área pública).
  - Opção B — raio mantido como exceção deliberada de marca da área logada, mas com o estado "selecionado" corrigido para bloco sólido (preto ou vinho) em vez do fundo bege suave atual, que é bug em qualquer uma das duas opções.

### O que NÃO desenhar / não decidir sozinho

Os quatro itens abaixo aparecem no plano de pesquisa como hipóteses **ainda sem validação de campo**. Não modele isso como se fosse uma decisão final — desenhe como alternativas anotadas (tipo a lógica de anotação que o canvas original já usa, com números e nota lateral), deixando explícito no artboard que a resposta certa depende da pesquisa que ainda vai rodar:

1. Raio da sidebar (ver acima) — apresentar as duas opções, não escolher uma.
2. Consolidação de `/user` + `/orders` numa tela só — desenhar as duas versões (separada vs. consolidada) como comparação, não substituir uma pela outra.
3. Login social "Continuar com Google" — não mexer nisso: **o código real já está correto** (ícone certo, altura de campo certa, estado de erro implementado). Não é para redesenhar essa parte.
4. Card de métrica "Falhas" clicável — pode desenhar a versão clicável como proposta, mas marque como "pendente de confirmação com a equipe interna" em vez de apresentar como certeza.

### Regras de sistema a manter (não regredir)

- Zero `border-radius` fora da sidebar (que é a única exceção em discussão).
- Nunca usar cinza de biblioteca — só tinta preta em opacidade (`--sl-line-hairline`, `--sl-line`, `--sl-line-strong`).
- DCC Ash só em número/preço/título curto; Fertigo só em manchete e corpo — nunca trocar os dois.
- Erro é sempre vinho (`--sl-danger`), nunca vermelho de sistema — e todo estado de erro precisa de frase de saída, não só a cor.
- Componentes já especificados no handoff (`Field` com estado de erro, `Chip` com nova variante `tone="danger"`, `Button`) devem ser reaproveitados — não crie componente novo se o handoff já resolveu.

### Formato de saída esperado

Artboards "Atual" (mantenha os que já existem, para comparação) + artboards novos "Proposto" para cada um dos 4 bugs confirmados, com a sidebar em duas variantes lado a lado (Opção A / Opção B) e anotação lateral explicando que 4 pontos específicos dependem de pesquisa de campo ainda não concluída.

---

## Anexos a levar para a sessão do Claude Design

- `claude/design-critique-canvas-admin.md`
- `claude/design-handoff-canvas-admin.md`
- `claude/user-research-plan-canvas-admin.md`
- `claude/research-synthesis-canvas-admin.md`
- `docs/qa/admin-dashboard-design-consistency.md` (do repo `selolibertaria-store` — esse não é um doc do projeto Claude Design, então cole o conteúdo do arquivo direto no prompt em vez de só citar o caminho)
