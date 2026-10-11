# Fatia 02 — Texto rico com imagem dentro

**Canvas:** `Fase 2 - Editor de Blocos.dc.html`. **Depende de:** 01 (a biblioteca alimenta o editor).

## Por quê
O editorial tem cinco botões de formatação (negrito, itálico, H2, H3, link) e a imagem é um campo separado, fora do texto. Sem lista, citação, imagem no meio do parágrafo, botão, desfazer ou prévia, qualquer mudança de estrutura volta para o desenvolvedor.

## Backend

1. **Conteúdo deixa de ser string.** Coluna nova `contentDoc` (jsonb) com **documento estruturado de nós** — não HTML livre (brecha de injeção e impossível de validar). Convive com a coluna antiga; o site lê `contentDoc` quando existe.
2. **Lista fechada de tipos**, validada no servidor com Zod: `heading`, `paragraph`, `list`, `quote`, `highlight`, `image`, `gallery`, `button`, `divider`, `productShelf`, `agenda`. Tipo fora da lista → 422. Nenhum estilo arbitrário no nó.
   - nó `image`: `assetId`, `cropId`, `layout` ("wide"|"side"|"center"|"gallery"), `caption`, `href?`, `alt` (herdado do asset).
3. **Renderer único** — um componente percorre o documento e mapeia cada tipo para o componente do design system. A prévia do admin e a página pública usam **o mesmo** renderer: é o que faz "ver como fica" ser verdade. Nenhum `dangerouslySetInnerHTML` no caminho.
4. **Rascunho e publicado separados** — `draftDoc`, `publishedDoc`, `publishedAt`, `updatedBy`. Autosave grava só o rascunho; o site lê só o publicado.
   - `PUT …/draft` (debounce) · `POST …/publish` · `POST …/revert`
5. **MediaUsage** — ao publicar, varrer os nós `image`/`gallery` e reescrever os vínculos daquela página. Sem isso o "usada em N lugares" da fatia 01 mente.
6. **Migração** — script que quebra o texto atual de cada campo em nós `paragraph`/`heading` e cria `publishedDoc`. Roda uma vez por página; se falhar, a página continua servindo o texto antigo.

Permissão: `editorial.write`.

## Front

- **Barra de ferramentas:** seletor de nível (Parágrafo/H2/H3), negrito, itálico, sublinhado, link, lista, lista numerada, citação, **Destaque do selo**, imagem, botão, separador, desfazer/refazer.
- **Arrastar a foto para dentro do texto** com linha-guia vinho mostrando onde vai cair, entre parágrafos.
- **Quatro formas de imagem, nomeadas** — faixa larga, ao lado do texto (esq/dir), centralizada menor, galeria (3–6). **Não** largura em pixel, **não** arrastar canto livre.
- **Barrinha do bloco** ao passar o mouse: Recortar · Trocar · Legenda · Mover ⇅ · Remover.
- **Recortar sem sair do editor** — abre o painel da fatia 01 por cima; ao confirmar, o cursor não se perde e o rascunho não recarrega. O recorte vale só naquele bloco.
- Barra de salvar flutuante + "Ver como fica" + estado publicado/rascunho (o editorial já tem: **reaproveitar**, não reescrever).

## Limite — importante
Ela escolhe e ordena blocos, troca textos e sobe fotos. **Não** escolhe fonte, cor, tamanho nem espaçamento. É o que separa "mais editável" de "vira outro site em um mês".

## Aceite
- Arrastar foto para o meio do texto e escolher entre as quatro formas, sem colar link.
- Recortar imagem inserida sem perder o rascunho.
- Reordenar, duplicar e apagar blocos sem código.
- "Ver como fica" idêntico à página publicada.
- Impossível mudar fonte, cor, tamanho ou espaçamento.

---

## Sub-prompts

### 02.1 — Esquema do documento
**Objetivo:** decidir o formato antes de escrever editor.
**Fazer:** coluna `contentDoc` (jsonb) convivendo com a antiga; schema Zod com a **lista fechada** de 11 tipos; nó `image` com `assetId`, `cropId`, `layout`, `caption`, `href?`; tipo fora da lista → 422.
**Aceite:** teste unitário provando que `{"type":"script"}` e um nó com `style` arbitrário são recusados; documento válido faz round-trip sem perda.

### 02.2 — Renderer único
**Objetivo:** "ver como fica" ser verdade.
**Fazer:** um componente que percorre o documento e mapeia cada tipo para o componente do DS; usado **tanto** na prévia do admin **quanto** na página pública; nenhum `dangerouslySetInnerHTML`.
**Aceite:** o mesmo documento renderizado nos dois contextos produz o mesmo HTML (snapshot test). Grep por `dangerouslySetInnerHTML` no caminho = 0.

### 02.3 — Rascunho, publicado e barra de salvar
**Fazer:** `draftDoc`/`publishedDoc`/`publishedAt`/`updatedBy`; `PUT …/draft` com debounce, `POST …/publish`, `POST …/revert`; reaproveitar a prévia ao vivo e a barra flutuante que o editorial **já tem**.
**Aceite:** autosave não publica nada; o site só muda depois de "Publicar"; `revert` volta o rascunho ao publicado; a barra mostra "Rascunho salvo às HH:MM".

### 02.4 — Editor de blocos (a tela)
**Fazer:** barra com nível, negrito, itálico, sublinhado, link, lista, lista numerada, citação, Destaque do selo, imagem, botão, separador, desfazer/refazer; inserir bloco pelo "+"; mover ⇅, duplicar, remover.
**Aceite:** reordenar, duplicar e apagar blocos sem tocar em código; desfazer funciona em 10 passos; o usuário **não consegue** mudar fonte, cor, tamanho ou espaçamento.

### 02.5 — Imagem dentro do texto
**Objetivo:** o pedido original — arrastar a foto para o meio do texto e editá-la ali.
**Fazer:** arraste com linha-guia vinho entre parágrafos; **quatro formas nomeadas** (faixa larga, ao lado do texto esq/dir, centralizada menor, galeria 3–6) — nunca largura em pixel; barrinha do bloco (Recortar · Trocar · Legenda · Mover · Remover); "Recortar" abre o painel de 01.4 **por cima** e, ao confirmar, o cursor não se perde e o rascunho não recarrega; ao publicar, reescrever `MediaUsage` daquela página.
**Aceite:** arrastar uma foto para o meio de um parágrafo, escolher a forma, recortar sem sair do editor e publicar — sem colar link e sem perder o rascunho. O "usada em N lugares" continua correto depois disso.

### 02.6 — Migrar o conteúdo atual
**Fazer:** script que quebra o texto de cada campo em nós `paragraph`/`heading` e cria `publishedDoc`; roda uma vez por página; falha deixa a página servindo o texto antigo.
**Aceite:** uma página piloto migrada e idêntica ao que estava no ar. **Só então** migrar as outras.
