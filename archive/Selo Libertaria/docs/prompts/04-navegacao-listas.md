# Fatia 04 — Achar as coisas e sair do lugar

**Canvas:** `Fase 4 - Navegacao e Listas.dc.html` · home aprovada em `Home Admin A.dc.html`. **Depende de:** 00. Menor esforço das quatro.

## Menu em três grupos
Hoje são 11 itens planos, sem hierarquia. Passa a:

- **Conteúdo** (primeiro — é o uso diário): Páginas, Eventos, Projetos, Imagens
- **Operação**: Pedidos, Produtos, Promoções, Clientes
- **Sistema**: E-mails enviados, Modelos de e-mail, Pagamentos recebidos, Configurações

Renomes: Editorial → **Páginas** (com Eventos e Projetos promovidos a itens próprios; eram os destinos mais usados e estavam em terceiro nível) · Recebimento → **Pagamentos recebidos** · Usuários → **Clientes** · **Imagens** entra novo (biblioteca da fatia 01).

Grupos com rótulo 9px/900/.26em uppercase. Capabilities inalteradas — só a etiqueta muda.

## Breadcrumb
As 13 subrotas do editorial não têm caminho de volta: o único link é "Voltar ao site", que sai do admin. Adicionar `Páginas › Eventos › Sarau Safado #14` com cada nível clicável, e fazer a sidebar marcar o item certo em subrota (hoje marca só "Editorial" em todas).

## Um componente de lista para as quatro listas
Hoje: E-mails tem busca + 2 filtros + paginação; Pedidos tem "até 50" e nada; Produtos tem busca sem paginação; Clientes não tem nem filtro por papel. **E-mails é a base** — o padrão sai de lá.

Barra única: busca · filtros · limpar · **exportar CSV** · seleção múltipla com ações em lote · paginação. Cliente sempre **por nome**, e-mail em segunda linha (nunca `break-all` de e-mail cru, nunca id em mono quebrando em três linhas).

## Home de atalhos
Três atalhos grandes — **Novo evento**, **Nova promoção**, **Editar página** — e abaixo, em duas colunas: próximos eventos (com rascunho sinalizado: "sem imagem de capa") e promoções ativas (com "vence em 3 dias" e rascunho "Retomar"). Pré-lançamento operado por uma pessoa: a primeira tela é de criação, não de dinheiro. O painel de operação vira aba **Relatórios**.

## Backend
1. **Paginação de verdade** — `page`/`perPage` (ou cursor) devolvendo `{items, total}`, com filtros e ordenação lidos da **URL** (filtro compartilhável, sobrevive ao F5). Índices em `createdAt`, `status` e no campo de busca de cada lista.
2. **Lote** — rota que recebe lista de ids + ação, aplica em transação e devolve o que falhou **item a item**; cada mudança grava no histórico do pedido que já existe. Falha parcial aparece na tela, não em toast.
3. **Exportar CSV** — mesma consulta da tela, em streaming, sem limite de página: exporta o que está filtrado.
4. **Rotas** — Eventos e Projetos saem de dentro do editorial: redirecionar as URLs antigas. Trocar o `force-dynamic` geral por cache onde a tela não precisa ser sempre fresca (é metade da sensação de lentidão).

## Aceite
- As quatro listas com a mesma barra.
- Nenhuma tela a mais de dois cliques do menu; toda subrota com caminho de volta.
- Filtro sobrevive ao recarregar e pode ser mandado por link.
- Clicar no menu não escurece a tela.
- Cliente por nome em toda lista.

---

## Sub-prompts

### 04.1 — Menu em três grupos e renomes
**Fazer:** Conteúdo (Páginas, Eventos, Projetos, Imagens) · Operação (Pedidos, Produtos, Promoções, Clientes) · Sistema (E-mails enviados, Modelos de e-mail, Pagamentos recebidos, Configurações); Eventos e Projetos saem do terceiro nível e ganham rota própria, com **redirect das URLs antigas**; capabilities inalteradas.
**Aceite:** nenhuma tela a mais de dois cliques do menu; URL antiga de evento redireciona; um vendedor continua vendo só o que podia ver.

### 04.2 — Breadcrumb e item ativo
**Fazer:** `Páginas › Eventos › Sarau Safado #14` com cada nível clicável nas 13 subrotas; sidebar marcando o item certo em subrota (hoje marca só "Editorial").
**Aceite:** de qualquer subrota dá para voltar **sem sair do admin**; o item ativo corresponde à tela.

### 04.3 — Componente de lista único
**Fazer:** extrair o padrão de **E-mails** (que já tem busca + 2 filtros + paginação) para um componente; aplicar em Pedidos, Produtos, Clientes; filtros e ordenação lidos da **URL**; paginação `page`/`perPage` devolvendo `{items, total}`; índices em `createdAt`, `status` e no campo de busca; cliente **por nome** com e-mail em segunda linha.
**Aceite:** as quatro listas com a mesma barra; filtro sobrevive ao F5 e pode ser mandado por link; nenhum e-mail cru com `break-all` nem id em mono quebrando em três linhas.

### 04.4 — Lote e CSV
**Fazer:** seleção múltipla; rota que recebe ids + ação, aplica em transação e devolve o que falhou **item a item**, gravando no histórico do pedido; exportar CSV com os filtros aplicados, em streaming.
**Aceite:** marcar 30 pedidos e despachar em uma ação; falha parcial aparece na tela listando quais; CSV baixado contém exatamente o conjunto filtrado.

### 04.5 — Home de atalhos
**Fazer:** três atalhos grandes (Novo evento · Nova promoção · Editar página) e, abaixo, próximos eventos (rascunho sinalizado: "sem imagem de capa") e promoções ativas ("vence em 3 dias", rascunho com "Retomar"); o painel de operação vira aba **Relatórios**; trocar o `force-dynamic` geral por cache onde a tela não precisa ser fresca.
**Aceite:** abrir `/admin` e criar um evento em um clique; o painel de números continua acessível em Relatórios; a home não repete a mesma contagem em três lugares.
