---
tipo: decisão (ler, não implementar)
depende_de: []
bloqueia: ["01-fundacao-tokens-componentes.md (parcial)", "02-product-card-category-filter.md", "03-home-faixa-categorias.md", "04-loja-filtros-ordenacao.md", "05-carrinho-frete.md"]
---

# Decisões pendentes antes de codar

Quatro decisões de produto/dado que a auditoria encontrou nas slices do Canvas. Nenhuma delas é
"UI a mais" — cada uma muda contrato de dado, fluxo ou URL pública. Seguindo o aviso do
`00-INDEX.md` original ("se o agente identificar que precisa mexer em schema/queries de catálogo,
deve parar e declarar em `PROGRESS.md`"), nenhum prompt de implementação desta pasta deve resolver
essas decisões sozinho — só executar depois que alguém do time responder aqui (ou em ticket
equivalente) e este arquivo for atualizado com a resposta.

## D1 — Renomear rota pública `/products` → `/loja`?

**Onde**: `src/lib/public-navigation.ts` (`shop: "/products"`), mais todo lugar que linka para lá
(`src/ui/nav/nav-menu.tsx`, `src/ui/footer/footer.tsx`, `src/app/(store)/products/page.tsx` e o
próprio diretório de rota `src/app/(store)/products/`).

**Por quê importa**: é mudança de URL pública/SEO, não só de label. `00-INDEX.md` divergência 5 já
sinalizou isso e pediu confirmação antes de mexer em redirects.

**Opções**:
- (a) Manter `/products`, só ajustar o label visível para "Loja" onde ainda disser "Livros"/outro.
- (b) Renomear para `/loja` com redirect 301 de `/products` preservado indefinidamente.

**Status**: sem decisão registrada. Nenhum prompt desta pasta deve tocar na rota até isso ser
respondido.

## D2 — Proporção de imagem do `ProductCard`: manter `2:3` (capa de livro) ou forçar `1:1` (token do Canvas)?

**Onde**: `src/ui/products/product-card.client.tsx:151` (`aspect-[2/3]`) vs. o token de geometria
em `prompts/00-CONTEXT.md` §3 ("Imagem de produto: proporção 1:1"). A PDP já usa `1:1`
(`product-image-gallery.client.tsx:72`, `aspect-square`) — a inconsistência é só entre a PDP e o
card de grade/relacionados/home.

**Por quê importa**: o catálogo de hoje é quase só livros — capas nativas em `2:3` ficam
recortadas/com barras se forçadas a quadrado. Se o Canvas prevê categorias não-livro (edições
sonoras, objetos, ingressos — ver D4), `1:1` faz mais sentido como padrão universal do card.

**Opções**:
- (a) Manter `2:3` no `ProductCard` (é o que já existe e funciona bem para livros) e considerar o
  token `1:1` do Canvas como referência só para categorias futuras não-livro.
- (b) Forçar `1:1` em todo `ProductCard`, com `object-fit: contain` sobre fundo bege para capas que
  não preenchem o quadrado.

**Status**: sem decisão registrada.

## D3 — Frete calculado no carrinho (antes do checkout) ou mantido só no checkout?

**Onde**: `src/components/cart-sidebar.tsx` (linha ~272, hoje mostra `"Calculado no checkout"`
como texto fixo) vs. a cotação real, que roda dentro de `/checkout` (Melhor Envio, server-side).

**Por quê importa**: mover a cotação para o carrinho é mudança de fluxo de compra, não de layout —
precisa de CEP capturado no drawer do carrinho (hoje o carrinho não pede CEP), uma chamada
server-side adicional nesse ponto, e trata do estado "sem CEP ainda" no resumo. `00-INDEX.md`
divergência 3 já classificou isso como decisão de produto, por isso a slice nasceu no modelo de
raciocínio.

**Opções**:
- (a) Manter frete só no checkout; no carrinho, só melhorar a redação do placeholder atual
  (ex.: "Frete calculado na próxima etapa" em vez de deixar cru).
- (b) Implementar cotação real no carrinho: campo de CEP no drawer, chamada à mesma rota/lib que o
  checkout usa (`src/lib/checkout` — confirmar o nome exato do client Melhor Envio antes de
  codar), cache da cotação para reaproveitar no checkout.

**Status**: sem decisão registrada. `05-carrinho-frete.md` cobre as duas opções e não deve ser
executado além do passo de decisão sem essa resposta.

## D4 — Categorias do Canvas (`Livros, Edições sonoras, Zines & impressos, Objetos, Ingressos,
Laboratórios`) entram no modelo de dado agora, ou o catálogo continua mono-categoria?

**Onde**: nenhuma ocorrência dessas strings em `src/lib/editorial-content-seed.ts` nem no restante
do repo (confirmado por grep). Não existe schema de categoria de produto além do que já suporta
`category/[slug]` (que hoje reflete taxonomia dinâmica genérica, não essas 6 categorias fixas do
Canvas).

**Por quê importa**: sem isso, `CategoryFilterBar` (slice 03), a faixa de categorias da Home
(slice 04) e qualquer filtro/ordenação por categoria em `/loja` (slice 05) não têm dado real para
mostrar — a única saída sem essa decisão é construir os componentes com placeholder/mock, o que
não é o que as slices originais pediam.

**Opções**:
- (a) Modelar as 6 categorias agora no backend (`backend/` FastAPI ou schema Mongo atual — o
  slice de dado teria que decidir onde), destravando 03/04/05 por completo.
- (b) Adiar: construir `CategoryFilterBar` e a faixa de categorias da Home já com a estrutura
  visual pronta, mas alimentados pela taxonomia dinâmica que já existe hoje (`listSystemCategoriesWithProducts`,
  usada em `src/ui/footer/footer.tsx`) em vez das 6 categorias fixas do Canvas — aceitando que o
  resultado visual pode não bater 100% com o Canvas até o dado ser modelado.

**Status**: sem decisão registrada. Os prompts `02`, `03` e `04` desta pasta assumem a opção (b)
como fallback documentado, mas não devem ser executados além disso sem confirmar com quem decide o
roadmap de dado.
