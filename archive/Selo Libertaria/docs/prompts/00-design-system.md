# Fatia 00 — Design system do admin em componentes

**Tipo:** refatoração de front. **Backend:** nenhum. **Bloqueia:** todas as outras fatias.

## Por quê
O `/admin` tem dois sistemas visuais convivendo: metade das telas segue o vocabulário editorial (reto, bege, vinho) e metade usa shadcn cru (raio 12px, branco, badge verde/vermelho, campo de 40px). Enquanto isso existir, cada fatia nova aplica o estilo duas vezes.

## O que fazer

1. Criar `src/app/admin/_components/ui/` com quatro componentes compartilhados:

   - **`MetricCard`** — fundo papel `#F7F4EF`, filete `rgba(11,11,11,.12)`, padding 20px, raio zero. Eyebrow 10px/900/.28em uppercase em vinho `#7A1E22`; valor em DCC Ash 30px; nota opcional 11px. Aceita `href` e `action` (já previsto no turno 2).
   - **`StatusBadge`** — altura 24px, padding `0 10px`, rótulo 10px/900/.2em uppercase, raio zero. Três tons: `neutral` (fundo `#D8D0C4`, texto `#7A1E22`), `active` (fundo `#0B0B0B`, texto `#F7F4EF`), `alert` (fundo `rgba(122,30,34,.12)`, filete `rgba(122,30,34,.4)`, texto `#7A1E22`). **Remover** todo `bg-green-*`/`bg-red-*` de status.
   - **`DataTable`** — cabeçalho em bege, rótulos 10px/900/.18em uppercase, linhas separadas por `rgba(11,11,11,.08)`, dinheiro em DCC Ash, raio zero, sem sombra. Props: `columns`, `rows`, `empty` (texto), `selectable`.
   - **`Field`** — altura 52px, fundo `#FFFFFF`, filete `rgba(11,11,11,.3)`, texto 16px, padding lateral 14px. Foco: filete `#0B0B0B` + `box-shadow:0 0 0 2px rgba(122,30,34,.2)`. Erro: filete `rgba(122,30,34,.3)`, fundo `rgba(122,30,34,.06)`, mensagem em vinho 13px.

   Botões: principal 48px tinta; destaque 48px vinho; secundário 48px papel branco com filete `.3` e hover bege. Rótulo sempre 11px/900/.24em uppercase. Estado carregando troca o texto ("Enviando…") — nada gira.

2. Trocar os usos em `/admin`: painel, pedidos, produtos, usuários, e-mails, configurações. Apagar os hex crus herdados do fork (`#fffdf8`, `#fbf7f1`, `#ded5ca`, `#18181b`, `#e4e4e7`, `#71717a`, `#f4f4f5`).

3. Sidebar: remover `rounded-xl` dos itens e da marca; item selecionado sólido em papel com texto tinta.

4. Trocar o overlay preto com spinner de toda navegação por indicador fino no topo + estado de carregando no item clicado. A tela anterior continua visível.

## Aceite
- `grep -rE "rounded|#e4e4e7|#71717a|bg-(green|red)-" src/app/admin` não retorna nada em tela de admin.
- Um badge de status, um cartão de métrica e uma tabela têm **uma** implementação cada.
- Campo em foco e em erro seguem o DS nas quatro telas de formulário.

---

## Sub-prompts

### 00.1 — Tokens no projeto
**Objetivo:** os valores do DS existirem em um lugar só, antes de qualquer componente.
**Toca:** `src/styles/` (ou o equivalente do repo), config do Tailwind, `@font-face` das duas fontes.
**Fazer:** importar `tokens/colors.css`, `typography.css`, `controls.css`, `spacing.css`; registrar DCC Ash e Fertigo; expor papel/papel-de-campo/bege/tinta/vinho/vinho-claro e os três filetes (`.12` cartão, `.2` régua, `.3` campo) como tokens nomeados; `borderRadius` do admin = 0.
**Aceite:** um componente novo consegue ser escrito sem digitar nenhum hex. `grep -c "#fffdf8\|#fbf7f1\|#18181b" src/app/admin` = 0 ao fim da fatia.

### 00.2 — Os quatro componentes compartilhados
**Objetivo:** uma implementação por peça.
**Toca:** `src/app/admin/_components/ui/{MetricCard,StatusBadge,DataTable,Field}.tsx`.
**Fazer:** construir com os valores do DS §4. `MetricCard` aceita `href`/`action` desde já (turno 2 previu). `StatusBadge` com três tons (`neutral`/`active`/`alert`) — nenhum verde/vermelho. `DataTable` com `columns`, `rows`, `empty`, `selectable`. `Field` com foco (filete tinta + halo vinho 2px) e erro (filete/fundo vinho translúcido + mensagem).
**Aceite:** Storybook ou página de sandbox mostrando os quatro em repouso, foco, erro, vazio e carregando. Nenhum deles aceita `className` que mude cor ou raio.

### 00.3 — Trocar os usos no /admin
**Objetivo:** matar o segundo sistema visual.
**Toca:** painel, pedidos, produtos, usuários, e-mails, configurações.
**Fazer:** substituir cartões, badges, tabelas e inputs pelos componentes de 00.2; apagar `#e4e4e7`, `#71717a`, `#f4f4f5`, `#fffdf8`, `#fbf7f1`, `#ded5ca`, `#18181b`; remover `rounded-*`; botões para 48px com rótulo 11px/900/.24em.
**Aceite:** `grep -rE "rounded|#e4e4e7|#71717a|bg-(green|red)-" src/app/admin` sem resultado. As seis telas passam a ter o mesmo botão, o mesmo campo e o mesmo badge.

### 00.4 — Sidebar e transição de página
**Objetivo:** tirar a sensação de lentidão e o raio herdado do fork.
**Toca:** `sidebar.client.tsx`, `topbar.client.tsx`, layout do admin.
**Fazer:** remover `rounded-xl` dos itens e da marca; selecionado sólido em papel com texto tinta; trocar o overlay preto com spinner por indicador fino no topo + estado de carregando no item clicado.
**Aceite:** clicar em qualquer item do menu **não escurece a tela** — a tela anterior fica visível até a nova pintar. Mobile (sheet) segue a mesma lista filtrada por capability.
