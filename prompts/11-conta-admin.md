---
slice: 11
titulo: Conta e admin: /login, /user, /admin sob o sistema novo
modelo: "padrão (Sonnet ou equivalente) — superfície grande mas sem decisão de fundação nova"
depende_de: ["01", "02"]
arquivos_previstos:
  - src/app/login/page.tsx
  - src/app/user/page.tsx
  - src/app/admin/_components/*  (ler antes de listar arquivos exatos)
canvas: "Canvas Selo Libertaria.dc.html, seção seção 06 — CONFIRMAR faixa de linhas ao vivo (grep data-screen-label) antes de codar"
custo_estimado: médio
---
## Objetivo
Telas de conta (`/login`, `/user`) e shell do admin (`/admin`) consumindo os tokens do slice 01, sem recriar a identidade visual do admin do zero.

## Contexto
Leia `prompts/00-CONTEXT.md` (seções 3, 4, 5, 6) e `prompts/PROGRESS.md` (entradas de slices anteriores: 1, 2).
Não releia o canvas inteiro — apenas a seção citada acima, e apenas depois de confirmar a faixa de linhas real com `grep -n "data-screen-label" "Canvas Selo Libertaria.dc.html"`.
Admin já tem direção própria documentada (`docs/design/userinterface.md`, seção Admin UI): sidebar preta, conteúdo papel, cards retos, hero curto, painéis claros, acento vinho. Este slice alinha ao mesmo sistema de tokens do público, não inverte essa direção.

## Especificação
Público (`/login`, `/user`): mesmos primitivos `Button`/`Field` do slice 01, `radius:0`, tipografia Fertigo/DCCAsh.
Admin: manter copy em `pt-BR` já documentada (`Painel` não `Dashboard`, `Configurações` não `Settings`, `Modelos de email` não `Email Templates`, `Ver pedido` não `Abrir`, `Salvar produto` não `Salvar` genérico quando ambíguo). Sidebar preta + conteúdo papel + cards retos + acento vinho — já é a direção atual, não inverter.

## Fora de escopo
Não redesenhar telas específicas do admin (produtos, pedidos, promoções etc.) além do shell/casca — isso é trabalho futuro fora deste plano de 12 slices. Não mudar autenticação/OAuth.

## Definição de pronto
- [ ] `yarn lint` e `yarn build` passam
- [ ] nenhum `border-radius` novo na área pública tocada por este slice
- [ ] mobile 390px e desktop 1440px conferidos
- [ ] nenhuma label em inglês residual nas telas tocadas
- [ ] atualizar `prompts/PROGRESS.md` com arquivos tocados e decisões (≤5 linhas)

## Se travar
Pare, escreva a dúvida em `prompts/PROGRESS.md` (seção deste slice) e não invente API nem dado. Não amplie o
escopo para "consertar" algo de um slice vizinho — registre e siga em frente ou peça revisão.
