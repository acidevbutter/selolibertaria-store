# Goal 6: Refatorar o shell do admin e as funções-base de navegação

## Objetivo

Consolidar o shell administrativo refinado do Selo Libertária em um sistema reutilizável de funções e primitives, reduzindo drift entre sidebar desktop, navegação mobile, hero operacional e páginas do backoffice.

Esta goal nasce da validação visual real do admin em `2026-06-18`, com foco em corrigir a base estrutural antes de continuar refinamentos pontuais de tela.

## Cobertura validada

- `/admin`
- Shell desktop do admin
- Shell mobile do admin
- Sheet mobile de navegação

## Problemas confirmados

### 1. Menus laterais com drift estrutural entre superfícies

- Evidência no código: `src/app/admin/_components/sidebar.client.tsx` e `src/app/admin/_components/topbar.client.tsx` repetem praticamente a mesma estrutura de marca, links, logout e estado ativo.
- Evidência visual: o padrão refinado existe, mas a navegação ainda depende de duas implementações paralelas, o que facilita diferenças futuras entre desktop e mobile.
- Impacto: qualquer ajuste de hierarquia, agrupamento, badge, ícone, sessão ou acessibilidade tende a ser aplicado pela metade e gerar nova divergência.
- Prioridade: alta

### 2. Hierarquia lateral mais fraca do que o shell editorial pede

- Evidência no código: `src/app/admin/_components/nav-config.ts` já define `icon`, mas a navegação renderiza apenas ponto + texto.
- Evidência visual: os menus ficam corretos no tema, porém pouco distintos entre si, especialmente quando o catálogo cresce ou quando surgirem novos grupos administrativos.
- Impacto: reduz escaneabilidade e enfraquece a sensação de sistema refinado prevista para o admin editorial.
- Prioridade: média-alta

### 3. Hero do dashboard com regressão visual real

- Evidência validada em `/admin` desktop: o heading `Painel de operação` aparece sobreposto na renderização do hero.
- Impacto: o problema quebra a leitura logo na entrada do backoffice e indica que a base do shell ainda precisa de estabilização antes de novos refinamentos visuais.
- Prioridade: alta

### 4. Viewport mobile com composição instável na abertura do dashboard

- Evidência validada em `390x844`: a estrutura principal não transmite imediatamente o conteúdo útil no primeiro quadro visível e o shell perde sensação de continuidade.
- Impacto: reduz confiança no admin refinado em telas menores e enfraquece a promessa de um mesmo sistema entre sidebar desktop e sheet mobile.
- Prioridade: alta

## Hipótese principal

O admin já tem direção visual boa, mas o shell ainda está espalhado entre config, sidebar, topbar e páginas-base sem uma camada clara de funções compartilhadas. Isso cria inconsistência visual, retrabalho e regressões mais fáceis em cada nova tela.

## Funções e primitives a criar

### Fonte de verdade da navegação

- `getAdminNavTree(role)` para devolver seções e itens visíveis por capacidade.
- `isAdminNavItemActive(pathname, href)` para centralizar a regra de ativo.
- `getAdminPageContext(pathname)` para devolver título curto, grupo atual e metadados úteis do shell quando necessário.

### Primitives do shell

- `AdminShellBrand`
- `AdminShellSessionCard`
- `AdminShellNav`
- `AdminShellNavGroup`
- `AdminShellNavItem`
- `AdminShellViewportFrame`

### Wrappers de superfície

- `AdminDesktopSidebar`
- `AdminMobileNavSheet`
- `AdminPageHero` ou evolução segura do `AdminEditorialHero` para telas operacionais

### Utilitários de UX

- helper único para estado de navegação/loading entre clique e troca de rota;
- contrato único para ícone, badge, helper text e label secundária dos itens;
- helpers de viewport para validar shell desktop e mobile sem drift.

## Regras da refatoração

1. Desktop e mobile devem consumir a mesma árvore de navegação.
2. Estado ativo, permissões e agrupamentos não podem ser recalculados em dois componentes diferentes.
3. O shell deve continuar escondendo áreas sem capacidade para o papel logado.
4. O hero operacional do dashboard não pode depender de composição frágil que gere sobreposição tipográfica.
5. A refatoração deve preservar queries, ações e guards já existentes nas páginas do admin.

## Sequência recomendada

1. Extrair a árvore de navegação e a lógica de item ativo para funções puras.
2. Criar primitives compartilhadas de marca, sessão e item de navegação.
3. Reescrever `sidebar.client.tsx` e `topbar.client.tsx` como cascas finas sobre essas primitives.
4. Estabilizar o hero do dashboard e revisar o enquadramento mobile inicial.
5. Validar `/admin`, `/admin/orders`, `/admin/products`, `/admin/editorial`, `/admin/settings` e `/admin/emails` em desktop e mobile.
6. Só depois continuar refinamentos pontuais de copy, badges e metadados por seção.

## Critérios de aceite

- Sidebar desktop e sheet mobile passam a usar a mesma base de funções e primitives.
- Não há duplicação relevante de markup entre `sidebar.client.tsx` e `topbar.client.tsx`.
- O estado ativo fica consistente em todas as rotas do admin.
- O dashboard abre sem heading sobreposto.
- O primeiro viewport mobile do admin comunica conteúdo útil e continuidade do shell.
- A `Goal 6` vira a referência para a próxima rodada de refatoração estrutural do backoffice.
