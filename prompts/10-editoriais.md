---
slice: 10
titulo: Editoriais: /projects, /sarau-safado, /events, /about, /contact, /faq
modelo: "rápido/barato (Haiku ou GPT-mini equivalente) — adaptação mecânica de layout já definido, sem estado complexo novo"
depende_de: ["02"]
arquivos_previstos:
  - src/app/projects/page.tsx
  - src/app/sarau-safado/page.tsx
  - src/app/events/page.tsx
  - src/app/about/page.tsx
  - src/app/contact/page.tsx
  - src/app/faq/page.tsx
canvas: "Canvas Selo Libertaria.dc.html, seção 1a-… (seção antiga do canvas — adaptar ao sistema novo, não implementar literalmente) — CONFIRMAR faixa de linhas ao vivo (grep data-screen-label) antes de codar"
custo_estimado: baixo
---
## Objetivo
Páginas editoriais existentes repetindo a gramática visual do canvas: hero dominante, poucas seções, alternância papel/preto, fechamento único antes do footer.

## Contexto
Leia `prompts/00-CONTEXT.md` (seções 3, 4, 5, 6) e `prompts/PROGRESS.md` (entradas de slices anteriores: 2).
Não releia o canvas inteiro — apenas a seção citada acima, e apenas depois de confirmar a faixa de linhas real com `grep -n "data-screen-label" "Canvas Selo Libertaria.dc.html"`.
Estas rotas já existem e têm conteúdo administrável via admin editorial (ver `docs/design/userinterface.md`, blocos `Atualização 2026-07-18 — organização do admin editorial`). Não recriar o modelo de dados — só a casca visual.

## Especificação
Cada página: hero dominante (imagem quando houver, gradiente/bloco de leitura, título grande, texto curto, CTA de continuidade), poucas seções (evitar acumular blocos), alternância entre fundo papel e preto (máx. 2 cores por página), fechamento único antes do footer (uma CTA final, não várias competindo).
`/events` especificamente: hero escuro com pôsteres empilhados, nota curatorial em duas colunas, linhas de agenda, arquivo/memória, CTA final única.
Cards de projeto/evento: imagem quando houver, título, período/local/status, resumo curto, CTA específica (`Ver projeto`, `Ver evento`, `Ver agenda` — nunca `View`/`Details`).

## Fora de escopo
Não mudar o schema editorial nem os formulários do admin que alimentam essas páginas. Não introduzir nova seção fora do que já existe em cada página.

## Definição de pronto
- [ ] `yarn lint` e `yarn build` passam
- [ ] nenhum `border-radius` novo na área pública tocada por este slice
- [ ] mobile 390px e desktop 1440px conferidos
- [ ] cada página abre e fecha com no máximo 2 cores de fundo alternadas
- [ ] atualizar `prompts/PROGRESS.md` com arquivos tocados e decisões (≤5 linhas)

## Se travar
Pare, escreva a dúvida em `prompts/PROGRESS.md` (seção deste slice) e não invente API nem dado. Não amplie o
escopo para "consertar" algo de um slice vizinho — registre e siga em frente ou peça revisão.
