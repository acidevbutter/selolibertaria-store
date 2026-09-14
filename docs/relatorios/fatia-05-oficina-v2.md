# Fatia 05 — Oficina v2 + Editor do turno 4

**Data:** 14 set 2026 · **Branch:** `feature/admin-design-refactor` (3 commits à frente do `origin`)
**Fonte de verdade:** projeto de design "Selo Libertaria" (`51b9f903`), lido via MCP do Claude Design

---

## Resumo

O painel foi migrado para a **Oficina v2**. A casca (rail e topbar), a tela Páginas e o editor de
blocos foram reconstruídos sobre o kit do projeto de design, não recriados de memória: os tokens e as
classes vieram de `tokens/admin.css` e `ui_kits/oficina/index.html`.

Dois problemas que existiam antes desta fatia foram corrigidos, e um terceiro — a persistência — foi
documentado e deixado em aberto porque depende do backend.

| Checagem | Resultado |
|---|---|
| `tsc` (projeto inteiro) | limpo |
| `biome check src` (434 arquivos) | limpo |
| `vitest` (suíte completa) | 165 passando, 0 falhando |
| Build de produção | exit 0, `Done in 142.35s` |

`17 files changed, 3036 insertions(+), 903 deletions(-)`

---

## O que mudou

### Camada de estilo (05.1)

| Arquivo | Origem |
|---|---|
| `src/styles/ad-tokens.css` | `tokens/admin.css` do projeto de design |
| `src/styles/ad-oficina.css` | classes do `ui_kits/oficina/index.html` |

As classes levam prefixo `ad-` e **todas** as regras são escopadas sob `.ad-root`, para que a loja
pública continue no sistema `--sl-*` sem nenhum vazamento. IBM Plex Mono entra por `next/font`;
DCC Ash não é carregada no bundle do admin.

### A casca (05.2)

- **Rail** de 264px com os três grupos (Conteúdo / Operação / Sistema) e as renomeações que a spec
  fixa: Editorial → **Páginas**, Usuários → **Clientes**, Recebimento → **Pagamentos recebidos**.
  Item de 44px, selecionado como bloco vinho sólido, contagem à direita em mono.
- **Subrota acende o item dela**, não o grupo; a rota-pai fica na lavagem fraca.
- **Topbar de 56px** — não existia antes desta fatia. O que havia era só um cabeçalho mobile com menu
  hambúrguer. Agora tem campo de busca, `⌘K`, "Ver o site ↗" e avatar de papel com as iniciais.
- **Busca global** sobre o scrim da casca, filtrando registros editoriais reais.
- **Fim do overlay preto**: troca de rota mostra a barra de 2px `#B3282E` e a tela anterior continua
  legível até a nova chegar.

### O editor (05.3 – 05.7)

Montado em `/admin/editorial/blocos`, com entrada pela tela Páginas.

- **14 controles** na ordem exata do §4, com Destaque do selo em bloco vinho.
- **Menu do "+"** com os 11 tipos, filtro por digitação, nome do schema em mono à direita e o rodapé
  do 422. Inserção também por atalho de texto (`##`, `-`, `1.`, `>`, `---`) e por arraste.
- **Barrinha por tipo**: bloco de imagem dá `image | Recortar | Trocar | Legenda | Mover ⇅ | Remover`;
  bloco de texto dá `Mover ⇅ | Duplicar | Remover`.
- **Recorte por cima** (canvas 4f): o painel da fatia 01 chamado de dentro do editor, não rota nova.
  Moldura arrastável com alças nos quatro cantos, as três proporções nomeadas, campo de descrição e a
  faixa de peso. Confirmar grava `cropId` e `alt` no nó e deixa o rascunho intacto.
- **Arraste**: soltar um arquivo cria o nó em `layout:"wide"` na posição da linha-guia e abre as
  quatro formas nomeadas no bloco novo, com Enter confirmando e Esc mantendo faixa larga. Nenhuma
  largura em pixel é exposta.
- **Os seis estados** do §6 com a microcópia literal, nenhum simulado — todos saem de validação real
  do documento real. Nenhum toast em `/admin`.

---

## Bugs

### Corrigidos nesta fatia

**[#83](https://github.com/acidevbutter/selolibertaria-store/issues/83) — o editor de blocos era inalcançável.**
`EditorialBlocksEditor` foi entregue em `6450863` (fatia 02.4) com os 11 tipos e undo/redo, mas
nenhuma rota o renderizava: o único arquivo que o importava era o próprio teste. A fatia 02 constava
como implementada e passava nos testes, e mesmo assim ninguém conseguia abrir o editor pela interface.
Os testes montam o componente direto, então nada falhava enquanto ele estava órfão.
Corrigido em `d0fa186`.

**[#84](https://github.com/acidevbutter/selolibertaria-store/issues/84) — teste reprovando rótulo legítimo.**
O teste do limite duro do §8 checava os rótulos por substring, e `"Recortar imagem"` contém `cor`
dentro de "Re**cor**tar". O mesmo valeria para "Acordeão" ou "Recorrente". É um falso positivo que
empurra quem for corrigir na direção errada — renomear o botão em vez de manter o limite. Passou a
casar palavra inteira, que continua pegando "Cor do texto" e "Tamanho da fonte".
Corrigido em `0bcf353`.

### Em aberto

**[#85](https://github.com/acidevbutter/selolibertaria-store/issues/85) — falta a persistência.**
Ver a seção seguinte.

---

## O que não está pronto

Nada disto é questão de tela. Registrar aqui para não passar por entregue:

**1. A chamada de rede.** A action `src/app/admin/editorial/blocks-actions.ts` valida o documento de
verdade — Zod contra a lista fechada, recusa de upload pendente, checagem de conflito — e **para
antes do `POST …/publish`**, com o `TODO(fatia 02.3)` no lugar. Na prática: o editor informa
corretamente o que *seria* enviado, mas nada chega ao banco. Os quatro testes da action exercitam a
validação; nenhum exercita rede.

Falta o contrato do §9 inteiro: `PUT …/draft`, `POST …/publish` (com a reescrita do `MediaUsage`, de
que depende o "usada em N lugares" do 05.6), `POST …/revert` (o botão "Voltar ao publicado" está
inerte) e o `publishedAt` vindo do servidor — sem ele o conflito de versão nunca dispara, porque a
checagem compara contra um valor que ninguém preenche.

**A validação de tipo precisa existir no servidor também.** O 422 de um 12º tipo forjado é critério
de aceite do 05.3, e hoje só o front garante — o que não vale como garantia.

**2. Upload real de imagem.** Depende do `BUTTER_BLOB_SERVICE_API_KEY`, vazio no dev local, então
esse caminho não dá para testar ponta a ponta aqui.

**3. Sub-prompt 05.8** (editar na própria página, `?edit=1`). A própria spec marca como etapa 2, com
a recomendação de entregar depois da coluna de 780px — que é o que esta fatia entregou.

---

## Decisão pendente

**Pré-venda saiu do menu.** O canvas `4b` lista 12 itens fechados e não inclui Pré-venda. Segui o
canvas, então `/admin/pre-venda` continua existindo como rota mas não aparece na navegação.
Reponho ou fica fora?

---

## Commits

| Hash | O que |
|---|---|
| `d0fa186` | Casca Oficina v2, busca ⌘K e a tela do editor de blocos |
| `0bcf353` | Recorte por cima, arraste de imagem e estados do editor |
| `a4d09df` | Estados de publicação (Publicando, Falhou, conflito de versão) |

Nenhum foi enviado ao remoto ainda.
