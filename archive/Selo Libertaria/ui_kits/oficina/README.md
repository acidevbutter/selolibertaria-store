# Oficina — UI kit do painel editorial

Recriação click-through de `/admin` com o sistema **Oficina v2** aplicado à casca inteira.
Abra `index.html`.

## O que está aqui

| Tela | Estado | Componentes |
| --- | --- | --- |
| Páginas | migrada | `ShellSidebar`, `ShellTopbar`, `LoadingBar`, `DeskPageHeader`, `DeskRow`, `StateBadge`, `SheetCard` |
| Eventos | migrada | as de cima + filtros em chips, `DeskField` de 36px, `EmptyState` |
| Editor (Sarau Safado #14) | migrada | `DeskBreadcrumb`, `EditorToolbar`, `ContentDoc`, `BlockFrame`, `BlockToolbar`, `DropGuide`, `InsertRow`, `BlockPicker`, `BlockOutline`, `ActionFooter` |
| Imagens | migrada | `MediaPlaceholder`, `CropOverlay` |
| Pedidos | migrada | métricas em folha, tabela de 48px, `StateBadge` |
| Produtos, Promoções, Clientes, E-mails, Modelos, Pagamentos, Configurações, Projetos | casca migrada, conteúdo em v1 | tela de "em migração" com a saída |

## Interações reais

- **Busca global** — clique no campo da topbar ou tecle `⌘K` / `Ctrl+K`; `esc` fecha. Resultados agrupados (Páginas e eventos · Operação · Ações).
- **Menu lateral** — troca de tela com barra de carregamento de 2px; nenhum overlay preto. Em `editor`, quem acende é **Eventos** (a subrota marca o item, não o grupo) e **Páginas** fica em hover fraco.
- **Editor** — hover em qualquer bloco mostra a barrinha de 28px com o tipo do nó; o "+" abre o menu dos 11 blocos; "Recortar" e "Imagem" abrem o overlay de recorte sobre a casca escurecida.
- **Índice de blocos** — clique seleciona (bloco vinho).

## Fora de escopo nesta recriação

Arraste real de arquivo, reordenação por drag e o modo `?edit=1` (edição sobre a própria página) estão desenhados no canvas do turno 4 e especificados em `guidelines/admin-design-system-v2.md`, mas não são simulados aqui.
