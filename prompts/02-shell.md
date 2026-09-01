---
slice: 02
titulo: Shell: Nav (busca, carrinho com contador) + Footer, labels e menu oficiais
modelo: "padrão (Sonnet ou equivalente) — consumo direto dos primitivos do slice 01, sem decisão de dados"
depende_de: ["01"]
arquivos_previstos:
  - src/ui/nav/nav.tsx
  - src/ui/nav/nav-menu.tsx
  - src/ui/nav/nav-mobile-menu.client.tsx
  - src/ui/footer/footer.tsx
  - src/ui/footer/footer.client.tsx
  - src/app/(store)/layout.tsx
canvas: "Canvas Selo Libertaria.dc.html, seção 2b, 2e — CONFIRMAR faixa de linhas ao vivo (grep data-screen-label) antes de codar"
custo_estimado: médio
---
## Objetivo
Nav e Footer usando os primitivos do slice 01, com o menu oficial (Loja, Projetos, Sarau Safado, Sobre, Contato) e CTA de sessão separada da navegação.

## Contexto
Leia `prompts/00-CONTEXT.md` (seções 3, 4, 5, 6) e `prompts/PROGRESS.md` (entradas de slices anteriores: 1).
Não releia o canvas inteiro — apenas a seção citada acima, e apenas depois de confirmar a faixa de linhas real com `grep -n "data-screen-label" "Canvas Selo Libertaria.dc.html"`.
Componentes existentes: `src/ui/nav/nav.tsx` (+ `nav-menu.tsx`, `nav-mobile-menu.client.tsx`, `search-nav.tsx`, `search-input.client.tsx`, `nav-scroll.client.tsx`) e `src/ui/footer/*`. Editar in-place — não recriar do zero.

## Especificação
Menu oficial, nesta ordem: `Loja`, `Projetos`, `Sarau Safado`, `Sobre`, `Contato`. Sem `Início`, sem `Eventos` no bloco principal (rota/conteúdo de `/events` continua acessível via Sarau/Home/footer).
CTA de sessão (`Entrar` / `Conta` / `Minha conta`) fica separada da navegação principal, à direita — `Comprar` **não** aparece no header.
Carrinho: ícone compacto, sem rótulo textual no desktop, com contador. No mobile pode coexistir com atalho flutuante quando o carrinho já tiver itens.
Footer mantém: copyright, métodos de pagamento (quando aplicável), newsletter, links auxiliares (`Perguntas frequentes`, `Termos`, `Privacidade`), crédito de desenvolvimento discreto se já existir.
Breakpoints a validar: 390 / 768 / 1024 / 1440 — sem overflow horizontal; menu mobile abre/fecha e mantém os 5 itens.

**Decisão a confirmar antes de codar, não durante**: o meta-prompt cita "rota `/loja`" — isso implica renomear a rota pública hoje em `/products`. Isso é mudança de URL pública (SEO, links salvos). Se essa renomeação não estiver explicitamente aprovada por quem pediu o slice, manter a rota atual (`/products`) e só ajustar o **label** do menu para "Loja"; registrar essa escolha em `PROGRESS.md`.

## Fora de escopo
Não mexer em `ProductCard` nem em conteúdo de página (slices 03+). Não implementar `CategoryFilterBar`. Não mudar lógica de carrinho (`cart-sidebar.tsx`), só a casca do ícone/contador no Nav.

## Definição de pronto
- [ ] `yarn lint` e `yarn build` passam
- [ ] nenhum `border-radius` novo na área pública tocada por este slice
- [ ] mobile 390px e desktop 1440px conferidos
- [ ] os 5 itens do menu aparecem idênticos em desktop e mobile
- [ ] `Comprar` não aparece no header em nenhum breakpoint
- [ ] atualizar `prompts/PROGRESS.md` com arquivos tocados e decisões (≤5 linhas)

## Se travar
Pare, escreva a dúvida em `prompts/PROGRESS.md` (seção deste slice) e não invente API nem dado. Não amplie o
escopo para "consertar" algo de um slice vizinho — registre e siga em frente ou peça revisão.
