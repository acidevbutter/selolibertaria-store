# Fatia 03 — Promoção em cinco passos

**Canvas:** `Fase 3 - Promocoes.dc.html` · layout aprovado em `Promocao Assistente B.dc.html`. **Depende de:** 00.

## Por quê
Hoje são 27 campos numa tela, slugs e ids digitados à mão e **zero prévia** do desconto resultante. É a tela de maior risco financeiro do admin e a que dá menos retorno ao operador.

## Estrutura
Assistente de 5 passos, trilha à esquerda, **prévia fixa à direita do passo 2 ao 5**:
**1 o que é → 2 quanto desconta → 3 onde vale → 4 quando → 5 revisar.**

Passo 1 = sete cartões de tipo, em linguagem de quem vende o catálogo: cupom de desconto, desconto direto, pré-venda, primeira compra, desconto em evento, **leve 3 pague menos**, **cupom de frete grátis**. Os dois últimos levam selo "em breve" até o backend existir — e o cartão explica por quê, em vez de falhar ao salvar.

Cada passo esconde o que o tipo já define: escopo, tipo técnico e prioridade não aparecem no passo 1; as duas janelas separadas de promoção e cupom viram uma pergunta no passo 4.

## Backend

1. **Simulação sem salvar** — `POST /api/admin/promotions/preview` recebe a promoção **não salva** e devolve `{productId, priceBefore, priceAfter}` por item afetado, **mais os conflitos**. Precisa reusar *a mesma* função de cálculo do carrinho: prévia com lógica própria mente.
2. **Alvos por id** — vínculos (`promotionId` + `productId`/`variantId`/`categoryId`) em vez de string separada por vírgula. Migração converte os slugs atuais; slug órfão vira aviso, não silêncio.
3. **Busca de produto** — `GET /api/admin/products/search?q=` com id, título, formato, preço e capa. Serve ao passo 3 e depois ao bloco "vitrine" da fatia 02.
4. **Tipo novo: leve 3, pague menos** — `minQuantity` + escopo "conjunto marcado", cálculo sobre o **carrinho inteiro** (não item a item). Decisão de produto: o desconto cai no **item mais barato**. Alcance: só a seleção marcada.
5. **Tipo novo: frete grátis** — alvo `target:"shipping"` aplicado **depois** do cálculo de frete, registrado separado no total do pedido (senão o relatório de receita fica errado). Toca checkout e e-mail de confirmação. É **cupom** (código divulgável), e **não acumula**: vale o maior desconto.
6. **Conflito** — existe prioridade e acumulação no modelo, mas nenhuma checagem no salvamento. O preview devolve os conflitos para o passo 5 avisar antes ("Ninfas do Tietê já está na pré-venda; o cliente leva o maior desconto").

## Front
- Passo 3: busca + checkbox no catálogo, com preço antes/depois na própria linha. Nunca campo de slug.
- Passo 5: **resumo em uma frase** ("Quem digitar RATO10 leva 10% off em 2 produtos, de 1 a 30 de outubro, limitado a 1 uso por cliente") + cartões dos produtos como o cliente vê, com preço riscado.
- "Publicar" e "Salvar rascunho" existem **só** no passo 5. Sair no meio retoma no passo em que parou.

## Aceite
- Cupom de 10% em dois títulos em menos de dois minutos, sem digitar slug.
- Preço final de cada produto visível antes de publicar, calculado pela função do carrinho.
- Promoção sobreposta gera aviso dizendo qual vale.
- Os dois tipos sem backend não permitem salvar pela metade.

---

## Sub-prompts

### 03.1 — Alvos por id e busca de produto
**Objetivo:** matar o pior campo do admin antes de desenhar o resto.
**Fazer:** vínculos `promotionId` + `productId`/`variantId`/`categoryId`; migração convertendo os slugs atuais (órfão vira **aviso**, não silêncio); `GET /api/admin/products/search?q=` com id, título, formato, preço e capa.
**Aceite:** nenhuma tela aceita slug digitado; a busca responde em <300 ms com 14 produtos; slug órfão da migração aparece num relatório.

### 03.2 — Rota de simulação
**Objetivo:** a prévia não pode ter lógica própria.
**Fazer:** `POST /api/admin/promotions/preview` recebendo a promoção **não salva** e devolvendo `{productId, priceBefore, priceAfter}` + conflitos, **reusando a mesma função do carrinho**.
**Aceite:** teste que aplica a mesma promoção via preview e via carrinho e compara centavo a centavo. Se divergir, é bug de arquitetura, não de arredondamento.

### 03.3 — Assistente de 5 passos
**Fazer:** trilha à esquerda, prévia fixa à direita do passo 2 ao 5 (layout `Promocao Assistente B`); passo 1 com os sete cartões de tipo; cada passo esconde o que o tipo já define; "Publicar"/"Salvar rascunho" **só** no passo 5; sair no meio retoma no passo em que parou.
**Aceite:** criar um cupom de 10% em dois títulos em menos de dois minutos. Fechar o navegador no passo 3 e voltar no passo 3.

### 03.4 — Passo 5 e conflito
**Fazer:** resumo em **uma frase** ("Quem digitar RATO10 leva 10% off em 2 produtos, de 1 a 30 de outubro, limitado a 1 uso por cliente"); cartões dos produtos como o cliente vê, com preço riscado; aviso de sobreposição vindo do preview.
**Aceite:** promoção sobre um título que já está em pré-venda gera aviso dizendo **qual vale**. Nenhum salvamento no escuro.

### 03.5 — Os dois tipos novos (podem ir depois)
**Fazer:** **leve 3, pague menos** — `minQuantity` + escopo "conjunto marcado", cálculo sobre o carrinho inteiro, desconto no **item mais barato**; **cupom de frete grátis** — `target:"shipping"` aplicado **depois** do frete, registrado separado no total, **sem acumular** (vale o maior desconto); toca checkout e e-mail de confirmação.
**Aceite:** enquanto não existirem, os cartões aparecem com selo "em breve", explicam por quê e **não permitem salvar pela metade**. Quando existirem: pedido de 3 itens cobra o desconto no mais barato, e frete grátis aparece como linha própria no total e no e-mail.
