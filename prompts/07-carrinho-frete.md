---
slice: 07
titulo: Carrinho + cálculo de frete no carrinho
modelo: "raciocínio (Opus ou equivalente, com plano antes de codar) — frete: cálculo, cache e edge cases — mudança de fluxo, não só de layout"
depende_de: ["03"]
arquivos_previstos:
  - src/components/cart-sidebar.tsx
  - src/components/cart-sidebar-host.tsx
  - src/lib/checkout/* (ler antes de mover — não duplicar lógica de cotação)
canvas: "Canvas Selo Libertaria.dc.html, seção 2d — CONFIRMAR faixa de linhas ao vivo (grep data-screen-label) antes de codar"
custo_estimado: alto
---
## Objetivo
Drawer de carrinho re-skinado nos tokens do slice 01, com a cotação de frete acontecendo no carrinho, antes do checkout, sem o total mudar depois.

## Contexto
Leia `prompts/00-CONTEXT.md` (seções 3, 4, 5, 6) e `prompts/PROGRESS.md` (entradas de slices anteriores: 3).
Não releia o canvas inteiro — apenas a seção citada acima, e apenas depois de confirmar a faixa de linhas real com `grep -n "data-screen-label" "Canvas Selo Libertaria.dc.html"`.
Lógica atual de frete (Melhor Envio) roda no `/checkout` (ver `docs/product/spec.md`, `docs/design/userinterface.md` atualização 2026-07-01, `AGENTS.md` linhas ~244-249, ~266). Ler essas seções antes de mover a chamada.

## Especificação
Composição do drawer (papel base, faixa superior preta, CTA principal preta, CTA secundária em contorno claro, vinho reservado para badge/hover/foco/remoção — ver `docs/design/userinterface.md` atualização 2026-06-30).
`CartLine` como bloco visual isolado (nome + variante + quantidade + preço unitário via `PriceBlock`).
Frete: campo de CEP + cotação exibida **dentro do carrinho**, antes de ir para `/checkout`; uma vez cotado, o valor viaja para o checkout e **não muda** lá (checkout só exibe o resumo, não recalcula por padrão).
`pickup` (retirada) continua uma opção válida e não pode ser removida do fluxo.
Uma leitura antiga e vazia de `/api/cart` nunca pode sobrescrever um carrinho mais novo — preservar a regra já documentada (badge, drawer e atalho flutuante respondem ao mesmo snapshot, contagem otimista até chegar snapshot atualizado).

## Fora de escopo
Não mexer no acordeão do checkout em si (slice 08) além do que for necessário para receber o frete já calculado. Não mudar o provider de frete nem a lógica de cotação do Melhor Envio — só onde ela é chamada.

## Definição de pronto
- [ ] `yarn lint` e `yarn build` passam
- [ ] nenhum `border-radius` novo na área pública tocada por este slice
- [ ] mobile 390px e desktop 1440px conferidos
- [ ] o total mostrado no checkout é idêntico ao cotado no carrinho, para o mesmo CEP e itens
- [ ] trocar item no carrinho depois de cotado invalida/re-cota o frete de forma visível, não silenciosa
- [ ] atualizar `prompts/PROGRESS.md` com arquivos tocados e decisões (≤5 linhas)

## Decisão de produto — não é só layout
Mover o cálculo de frete do checkout para o carrinho muda o momento em que o usuário vê o custo total e pode
mudar taxa de abandono e como o backend cacheia a cotação (hoje pensado para acontecer uma vez, no checkout).
Antes de implementar: (1) confirmar que quem pediu este slice está ciente de que isso é mudança de fluxo, não
reskin; (2) checar se `src/lib/checkout/*` já expõe a cotação como função reutilizável fora do checkout — se
não expuser, este slice inclui extrair essa função (sem duplicar lógica), o que pode empurrar o slice acima de
6 arquivos — nesse caso, quebrar em `07a` (extração da função) e `07b` (UI do carrinho).

## Se travar
Pare, escreva a dúvida em `prompts/PROGRESS.md` (seção deste slice) e não invente API nem dado. Não amplie o
escopo para "consertar" algo de um slice vizinho — registre e siga em frente ou peça revisão.
