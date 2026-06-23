# Goal 4: Otimizar a usabilidade do admin

## Objetivo

Consolidar a próxima etapa do backoffice com foco em usabilidade real de operação, atacando primeiro os problemas que atrapalham leitura, preenchimento, consistência de idioma e confiança nas telas do admin.

## Cobertura navegada

- `/admin`
- `/admin/orders`
- `/admin/products`
- `/admin/products/slug-kebab`
- `/admin/editorial`
- `/admin/editorial/events`
- `/admin/editorial/projects`
- `/admin/editorial/sarau-safado`
- `/admin/editorial/about`
- `/admin/editorial/contact`
- `/admin/editorial/home`
- `/admin/promotions`
- `/admin/users`
- `/admin/users/6a2f3da4d00c5750b68410a4`
- `/admin/emails`
- `/admin/settings`
- `/admin/email-templates`
- `/admin/webhooks`

## Problemas confirmados

### 1. Erro de runtime em `email-templates`

- Rota: `/admin/email-templates`
- Evidência: console registrando `Uncaught TypeError: Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'.`
- Impacto: a tela de preview já nasce com erro em runtime, o que reduz confiança para evoluir preview, testes de template e automações de email.
- Prioridade: alta

### 2. Backoffice com superfícies legadas fora do padrão editorial e de idioma

- Rotas mais evidentes: `/admin/products/slug-kebab`, `/admin/settings`, `/admin/email-templates`
- Evidência: mistura forte entre `pt-BR` e inglês em headings, labels, CTAs e textos de ajuda, com exemplos como `Products`, `Product editor`, `Shared product details`, `Save group`, `Admin theme`, `Save regional defaults`, `Account verification`.
- Impacto: quebra a consistência operacional do admin, aumenta carga cognitiva e enfraquece a leitura de produto já definida para o shell editorial.
- Prioridade: alta

### 3. Formulários ainda exigem esforço manual demais

- Rotas mais claras: `/admin/products/slug-kebab`, `/admin/settings`, formulários editoriais e futuros cadastros administrativos longos.
- Evidência: campos como slug, CEP, telefone, URLs, códigos e números operacionais aparecem sem ajuda de autoformatação ou normalização visual, e ainda existem superfícies exibindo moeda como se fosse uma escolha de configuração desta fase.
- Impacto: aumenta erro de preenchimento, reduz velocidade de operação e torna o admin mais cansativo em tarefas repetitivas.
- Prioridade: alta

## Pilares da Goal 4

### 1. Usabilidade operacional acima de cosmética

- Cada tela do admin deve ajudar a pessoa operadora a entender rápido onde está, o que pode fazer e qual é o próximo passo.
- A prioridade não é adicionar mais camadas visuais, e sim remover atrito de leitura, edição e decisão.

### 2. I18n correto e consistente no backoffice

- O admin deve seguir por padrão o idioma resolvido a partir do ambiente e da configuração ativa do projeto.
- A interface não pode mais misturar inglês e `pt-BR` por acidente dentro da mesma jornada.
- Quando a superfície usar tradução, ela deve usar a mesma estratégia de i18n do produto, com fallback previsível e sem strings hardcoded espalhadas.

### 3. Formulários com autoformatação útil

- Campos administrativos devem ajudar o preenchimento sem esconder o dado real salvo.
- Prioridades iniciais: telefone, CEP, slug, códigos/identificadores operacionais, URLs e campos numéricos recorrentes.
- A máscara ou formatação deve reduzir erro humano, mas sem bloquear edição manual quando fizer sentido.

### 4. Simplificação de moeda nesta fase

- O admin não deve expor configuração de moeda enquanto o projeto estiver operando apenas com a moeda definida pelo ambiente.
- Conversão para outras moedas fica fora da Goal 4 e deve entrar só no fim da trilha planejada.
- Qualquer UI de settings que sugira escolha manual de moeda nesta etapa aumenta complexidade sem benefício real.

## Oportunidades prioritárias

### 1. Normalizar idioma e copy do admin inteiro

- Rotas mais evidentes: `/admin/products/slug-kebab`, `/admin/settings`, `/admin/email-templates`
- Sinal atual: há mistura acidental de inglês e `pt-BR`, inclusive em labels, botões e textos de ajuda.
- Oportunidade: ligar essas telas ao i18n correto, respeitando o idioma padrão vindo do ambiente/configuração e removendo textos legados fora do fluxo de tradução.

### 2. Introduzir autoformatação nos formulários do admin

- Rotas mais claras: `/admin/settings`, `/admin/products/slug-kebab`, cadastros editoriais e futuras telas administrativas densas.
- Sinal atual: o preenchimento depende de atenção manual em campos estruturados.
- Oportunidade: adicionar formatação assistida em slug, telefone, CEP, códigos, URLs e números operacionais para reduzir erro e retrabalho.

### 3. Remover configuração de moeda das telas de settings

- Rotas mais claras: `/admin/settings` e formulários administrativos que ainda tratem moeda como escolha operacional.
- Sinal atual: a interface ainda pode sugerir que moeda é configurável no admin desta fase.
- Oportunidade: assumir somente a moeda do ambiente, remover controles de configuração de moeda e adiar qualquer UX de conversão para a etapa final do projeto.

### 4. Melhorar escaneabilidade do hub editorial

- Rota: `/admin/editorial`
- Sinal atual: todos os cards usam o mesmo CTA `Abrir seção`.
- Oportunidade: trocar CTA genérico por ações mais específicas e acrescentar metadados rápidos como status, última atualização e volume de itens por seção.

### 5. Dar ação real para empty states

- Rotas mais claras: `/admin`, `/admin/orders`, `/admin/webhooks`, `/admin/emails`
- Sinal atual: os estados vazios informam bem, mas raramente conduzem o próximo passo.
- Oportunidade: incluir ações contextuais como abrir storefront, criar primeiro item, revisar integrações ou validar fluxo de compra.

### 6. Reduzir densidade cognitiva em `settings`

- Rota: `/admin/settings`
- Sinal atual: a tela concentra regionalização, suporte, OAuth e frete em sequência longa.
- Oportunidade: reorganizar em blocos expansíveis, reforçar hierarquia visual e deixar ações de salvar mais previsíveis por seção.

### 7. Evoluir o preview de templates para uso operacional

- Rota: `/admin/email-templates`
- Sinal atual: há preview em `iframe`, mas falta contexto operacional ao redor.
- Oportunidade: adicionar metadados do template, variáveis de exemplo, estado de origem do suporte e futura ação de envio de teste.

### 8. Completar a migração editorial das superfícies administrativas

- Rotas mais claras: `/admin/products/slug-kebab` e partes de `/admin/settings`
- Sinal atual: o shell editorial convive com blocos ainda herdados do starter.
- Oportunidade: aplicar o mesmo enquadramento de copy, seções e feedback operacional já visto em dashboard, users, webhooks e páginas editoriais.

## Sequência recomendada

1. Corrigir o erro de runtime em `email-templates`.
2. Corrigir o i18n do admin para seguir o idioma padrão resolvido pelo ambiente/configuração, removendo a mistura acidental entre inglês e `pt-BR`.
3. Remover configuração de moeda das telas administrativas desta fase e assumir apenas a moeda do ambiente.
4. Introduzir autoformatação nos campos administrativos com maior incidência de erro.
5. Migrar páginas legadas críticas de produto e configuração para o mesmo enquadramento visual e textual.
6. Melhorar hubs e empty states com CTAs contextuais e sinais rápidos de operação.
7. Fazer uma segunda passada específica em acessibilidade e microinterações depois da estabilização.

## Progresso em 2026-06-18

- `settings` avançou na normalização de idioma em `pt-BR` nos blocos de padrão regional, suporte, OAuth e frete.
- `promotions` recebeu uma primeira passada ampla de tradução operacional, reduzindo boa parte do inglês legado em seções, labels, regras e mensagens auxiliares.
- Os formulários de produto tiveram nova limpeza de copy, incluindo disponibilidade, bloco de imagens e preview em `pt-BR`.
- `email-templates` e os HTMLs reais dos templates começaram a convergir para `pt-BR`, reduzindo a divergência entre o preview administrativo e o conteúdo efetivamente enviado.
- `promotions` também recebeu uma passada de ergonomia nas larguras dos campos, para que códigos, datas, limites e valores não usem inputs longos demais sem necessidade.
- A revisão textual continuou em superfícies editoriais e de templates do admin, corrigindo resíduos como `Prévia`, `Configurações`, `Rótulo público`, `Nome visível`, `coleção`, `publicação`, `período` e `ações rápidas`.
- A camada de i18n do servidor deixou de forçar `pt-BR` por código e voltou a resolver locale por override explícito em cookie, idioma do browser e fallback do `env`, alinhando a base com o objetivo da Goal 4.
- `node_modules/next/package.json` foi reparado por reinstalação local e voltou a parsear corretamente.
- O boot do Next também acusou `ERR_INVALID_PACKAGE_CONFIG` em `node_modules/@swc/helpers/package.json`; o pacote foi reparado e o servidor voltou a anunciar `Ready`.
- A validação local por `./node_modules/.bin/tsc --noEmit` passou após o reparo do ambiente.
- Mesmo com o `next dev` pronto, requests a `/login` e `/admin/email-templates` ainda ficaram sem resposta via `curl`, então a prova visual desta rodada continua pendente de diagnóstico do primeiro request/compilação em runtime.
- A biblioteca de `email-templates` foi simplificada para operar com `supportEmail` resolvido no servidor, busca client-side estável, categorização visível por template, recarga explícita da prévia e `iframe` com `sandbox`, reduzindo dependência de hidratação assíncrona só para dados básicos da tela.
- Na mesma passada, o filtro deixou de manter uma prévia residual quando não há resultados: o seletor agora desabilita sem opções válidas e a área principal mostra um empty state coerente com a busca.
- `settings` deixou de abrir como uma sequência longa de cards iguais e passou a agrupar os ajustes em seções recolhíveis com contexto curto para aparência, região, suporte, acesso e frete, reduzindo carga cognitiva sem esconder a ação principal de cada bloco.
- `products` também recebeu limpeza de copy técnica ao trocar o estado de falha de `Catálogo Stripe indisponível` por uma mensagem mais operacional e neutra.
- `admin/products/categories`, `admin/products/new` e `admin/products/[slug]` receberam nova passada de microcopy em `pt-BR`, com correção de acentuação, remoção de referência técnica desnecessária à Stripe e humanização da origem de categoria em `Catálogo` / `Manual`.
- `promotions` deixou de depender de fallback visual hardcoded em `BRL` nas conversões de benefício e subtotal mínimo; a tela agora assume a moeda do ambiente também na camada de leitura.
- As actions de `promotions` também passaram a devolver erros em `pt-BR`, reduzindo fricção quando algum dado obrigatório ou numérico é preenchido incorretamente.
- `webhooks`, retentativas de `emails` e preview de imagem de produto receberam nova passada de linguagem operacional em `pt-BR`, substituindo resíduos como `Event ID`, `Abrir payload`, `Failed to resend email`, `No image` e `Image preview`.
- Na mesma trilha, detalhes secundários do admin também foram normalizados: `Message ID` virou `ID da mensagem`, o título do `iframe` de preview de email foi traduzido e os fallbacks de imagem herdada de produto passaram a usar `Imagem do produto`.
- `StatusBadge` e a listagem de `orders` também foram alinhados à Goal 4: status compartilhados agora aparecem em `pt-BR` (`Pago`, `Processado`, `Em disputa`, `Em processamento`, `Cancelado`), e a listagem administrativa de pedidos passou a formatar moeda e data com padrão local em vez de defaults técnicos.
- Os filtros compartilhados do dashboard e da listagem de pedidos também deixaram de vazar inglês legado: `All`, `Last 30 days`, `Date (newest)` e estados crus foram traduzidos para `Todos`, `Últimos 30 dias`, `Data mais recente`, `Concluído`, `Exige ação` e equivalentes em `pt-BR`.
- O dashboard `/admin` recebeu mais uma limpeza de vocabulário operacional, trocando resíduos como `fulfillment`, `ingest`, `storefront` e `tracking` por `expedição`, `recebimento de eventos`, `loja` e `código de rastreio`.
- Os detalhes de pedido seguiram a mesma regra: hero, métricas, bloco de atualização e histórico de auditoria deixaram de expor `fulfillment` na UI e passaram a usar `expedição` e `Salvar expedição` sem alterar a modelagem interna.
- Os formulários editoriais de `events` e `projects` também passaram a autoformatar `slug` em kebab-case durante a digitação e ao sair do campo, expandindo a ergonomia da Goal 4 para além do fluxo de produto.
- O hub editorial e as páginas institucionais correlatas também tiveram nova limpeza de copy, trocando `storefront` e referências cruas ao nome técnico da frente pública por `área pública` ou `site`, além de corrigir acentuação residual em `catálogo`, `superfície` e `seção`.
- `settings` avançou na mesma direção com autoformatação útil em suporte e frete: o email de suporte agora é normalizado em minúsculas sem espaços sobrando, e o editor de provedores formata `code`, `Base URL`, endpoints, lista de países, código de serviço e credenciais de país/CEP ao sair do campo.
- Na mesma passada, os presets de frete deixaram de vazar labels e descrições em inglês no admin: `Custom HTTP`, `API key`, `Origin postal code` e afins foram traduzidos para `HTTP personalizado`, `Chave da API`, `CEP de origem` e equivalentes em `pt-BR`.
- O bloco de OAuth também recebeu a mesma limpeza: `Client ID` e `Client secret` viraram `ID do cliente` e `Segredo do cliente`, com trim no blur e campos sensíveis sem capitalização/correção automática.
- `promotions` também ganhou uma passada de previsibilidade de preenchimento: o campo de código do cupom agora desativa autocorreção/capitalização inadequada e explica que caixa e espaços extras são normalizados ao salvar.
- Na mesma seção, campos de `productSlugs`, `categorySlugs` e `variantIds` passaram a declarar que aceitam vírgula ou quebra de linha e que a normalização acontece no save, reduzindo ambiguidade operacional mesmo sem transformar o formulário em editor técnico.
- O seletor de ambiente em frete também foi alinhado à linguagem da Goal 4 ao trocar `Sandbox` por `Teste`.
- A passada final de nomenclatura também alcançou `users` e detalhes de configuração: `Admins` virou `Administradores`, `Vendors` virou `Vendedores`, o seletor de papel passou a exibir `Administrador` e o frete trocou `Base URL` por `URL base`.
- A navegação lateral e os helpers de OAuth também receberam o mesmo acabamento final: `Dashboard` virou `Painel`, `Templates` virou `Modelos de email`, e descrições como `OpenID Connect` / `OAuth social` foram reescritas em linguagem mais operacional.
- A rodada seguinte fechou mais dois resíduos estruturais: `admin/settings` deixou de reintroduzir `Moeda` até nos cards de resumo e passou a destacar apenas defaults regionais, enquanto o lockup compartilhado do shell administrativo trocou `admin editorial` por `painel editorial`.
- O shell de login também voltou a respeitar o idioma resolvido pela aplicação: título principal, descrição, alt da capa, copyright, tagline e links legais saíram do hardcode em português e passaram pela camada de i18n em `messages`, evitando telas híbridas quando o locale ativo não é `pt-BR`.
- A continuação dessa passada refinou a coerência visual restante: `email-templates` trocou `Templates` por `Emails`/`Modelos` na moldura principal, `promotions` removeu a sigla explícita da moeda da copy introdutória e `admin/settings` passou a nomear idiomas a partir do locale resolvido da aplicação, não do idioma do navegador.
- A mesma limpeza alcançou `admin/users`: o resumo deixou de falar em `backoffice`, e a tabela passou a traduzir papéis crus como `admin`, `vendor` e `customer` para `Administrador`, `Vendedor` e `Cliente`.
- A continuidade da varredura também ajustou o editorial administrável: `projects` deixou de falar em `backoffice`, e a edição da home passou a se apresentar como `Página inicial` em vez de misturar `Home` com o restante da interface em `pt-BR`.
- O hub editorial e o formulário compartilhado da home seguiram a mesma regra logo depois: cards, métricas e o título do formulário deixaram de usar `Home` e passaram a adotar `Página inicial` de ponta a ponta.
- A revisão também alcançou os previews internos de email: dados de amostra deixaram de exibir `devbutterstore.local`, `T-shirt` e `Poster`, adotando exemplos coerentes com o universo do Selo Libertária para reduzir a sensação de starter não finalizado.
- A continuação na área de catálogo fechou mais um bloco de usabilidade: `admin/products` e `admin/products/[slug]` passaram a formatar preços com o locale resolvido do admin, o histórico visível foi traduzido para `pt-BR`, a listagem deixou de usar `Nenhum produto encontrado` em uma tela de livros e os cartões de variante removeram ids técnicos da Stripe que só poluíam a operação.
- A passada seguinte voltou ao login para fechar a consistência de i18n no fluxo de autenticação: divisor social, passos do cadastro e CTAs como `Continuar` / `Continue to preferences` saíram do hardcode em `src/ui/auth/oauth-buttons.tsx` e `src/ui/auth/register-form.client.tsx`, passando a responder ao locale ativo como o restante da tela.
- Na continuação, a limpeza subiu para o nível de primitives compartilhadas: `src/ui/shadcn/dialog.tsx` e `src/ui/shadcn/sheet.tsx` deixaram de expor `Close` fixo em inglês no `sr-only`, usando agora a camada global de tradução para manter modais e menus coerentes com o locale ativo.
- A rodada seguinte fechou a shell compartilhada do admin e do header público: `src/app/admin/layout.tsx`, `src/app/admin/_components/sidebar.client.tsx`, `src/app/admin/_components/topbar.client.tsx` e `src/ui/nav/nav.tsx` deixaram de carregar `Voltar ao site`, `Abrir menu`, `Sair`, `Sessão` e CTAs de conta em idioma fixo, passando a responder ao locale ativo pela camada de i18n.
- A passada rápida seguinte fechou resíduos visíveis fora do fluxo principal do admin: `src/app/global-error.tsx` deixou de carregar fallback em inglês, `src/app/not-found.tsx` passou a traduzir o CTA de catálogo, e a visão geral de conta removeu um `TODO` exposto na descrição.
- A rodada seguinte atacou o miolo analítico do admin: `src/app/admin/page.tsx`, `src/app/admin/orders/page.tsx`, `src/app/admin/orders/[id]/page.tsx`, `src/ui/charts/revenue-sparkline.client.tsx` e `src/ui/charts/revenue-zoom-brush.client.tsx` deixaram de fixar `pt-BR` ou `en-US` na formatação de moeda e data, passando a usar o locale resolvido do admin com fallback de moeda vindo do `env`; na mesma passada, `email-templates` alinhou o título para `Modelos de email`.
- A passada seguinte levou a mesma regra para superfícies operacionais de auditoria: `src/app/admin/emails/page.tsx` e `src/app/admin/webhooks/page.tsx` deixaram de fixar datas em `pt-BR`, e o modal de `src/app/admin/emails/_components/email-log-table.client.tsx` trocou `Template` por `Modelo`, mantendo a leitura coerente com o restante do backoffice.
- A rodada seguinte limpou componentes auxiliares de operação: `src/app/admin/_components/admin-support-email.client.tsx` passou a usar `Input` e `Button` compartilhados, enquanto `src/app/admin/products/_components/admin-image-url-list.client.tsx` removeu fallback em inglês no upload e trocou descrições técnicas de preview/remoção por linguagem operacional mais clara.
- A passada seguinte refinou as superfícies de preview: `src/app/admin/email-templates/_components/email-templates-preview.client.tsx` trocou copy visível de `template` por `modelo`, adotou `Input` e `Button` compartilhados na busca e na recarga da prévia, e `src/app/admin/products/_components/admin-product-image-preview.tsx` deixou a descrição do modal e o helper de quantidade mais explícitos para revisão operacional.
- A rodada seguinte fechou mais alguns resíduos finos do backoffice: `src/app/admin/editorial/events/page.tsx` deixou de fixar `pt-BR` nas datas, `src/app/admin/orders/_components/update-fulfillment.client.tsx` trocou o fallback `Failed` por mensagem operacional em `pt-BR`, `src/app/admin/webhooks/page.tsx` rebatizou `Headers`/`Payload` para `Cabeçalhos`/`Evento bruto` e `src/app/admin/emails/page.tsx` alinhou a busca para `modelo`.
- A passada seguinte alcançou o suporte visual e os erros do catálogo: `src/ui/charts/paid-vs-failed-donut.client.tsx` trocou a legenda para `Pago` e `Falhou`, e `src/app/admin/products/actions.ts` deixou de lançar mensagens em inglês para categoria ausente, preço herdado ausente, campos obrigatórios e livro não encontrado no catálogo administrativo.
- Na continuidade, `src/app/admin/editorial/projects/page.tsx` também deixou de fixar `pt-BR` em `updatedAt`, alinhando a listagem de projetos à mesma regra de locale já aplicada em `events`.
- A rodada seguinte fechou mais três pontos da mesma família: `src/app/admin/promotions/page.tsx`, `src/app/admin/users/[id]/page.tsx` e `src/app/admin/editorial/_components/editorial-meta-card.tsx` deixaram de fixar `pt-BR` na formatação de datas e passaram a usar o locale resolvido do admin.
- A passada rápida seguinte fechou dois atritos residuais da Goal 4: `src/app/admin/_components/admin-regional-settings.client.tsx` deixou de abrir com `en-US` fixo e passou a nascer do locale já resolvido pela aplicação, enquanto `src/app/admin/products/[slug]/page.tsx` ganhou a mesma autoformatação de `slug` usada na criação de livros.
- A continuação imediata da rodada refinou ergonomia e consistência final em dois pontos visíveis: `src/app/admin/promotions/page.tsx` reduziu larguras excessivas em campos curtos como prioridade, valor, subtotal, datas e limites, e `src/app/admin/email-templates/page.tsx` + `src/app/admin/email-templates/_components/email-templates-preview.client.tsx` deixaram de fixar `BRL` no preview, passando a usar a moeda do ambiente também nos dados de exemplo.
- A passada seguinte fechou mais um detalhe de escaneabilidade em `settings`: `src/app/admin/_components/admin-support-email.client.tsx` e `src/app/admin/_components/admin-oauth-providers.client.tsx` deixaram de esticar inputs simples por toda a largura disponível, aproximando email operacional e credenciais sensíveis do tamanho real do dado.
- A continuação rápida aplicou a mesma regra em taxonomias: `src/app/admin/products/categories/page.tsx` reduziu a largura dos campos de criar e renomear categoria, evitando linhas longas demais para um dado normalmente curto.
- A passada final desta rodada ajustou também `src/app/admin/settings/theme-selector.client.tsx`, adicionando contexto curto ao tema do admin e limitando o seletor a um controle mais compacto, em linha com a baixa complexidade dessa escolha.
- A continuação imediata fechou mais um fallback silencioso de moeda: `src/app/admin/products/[slug]/page.tsx` e `src/app/admin/products/_components/admin-variants-panel.client.tsx` deixaram de cair em `BRL` fixo no painel de variantes e passaram a usar a moeda do ambiente quando a variante ainda não expõe uma sigla própria.
- A passada seguinte fechou mais um resíduo lexical simples em `src/app/admin/settings/theme-selector.client.tsx`, trocando `backoffice` por `admin` para manter a mesma nomenclatura operacional do restante da Goal 4.
- A continuação imediata refinou o dashboard principal em `src/app/admin/page.tsx`, trocando pills saudáveis de `OK` por `Em dia` para manter a leitura 100% operacional em `pt-BR`.
- A passada seguinte atacou um resíduo de vagueza no hub editorial: `src/app/admin/editorial/page.tsx` deixou de repetir `Abrir seção` em todos os cards e passou a usar CTAs específicos por superfície, como `Gerenciar eventos`, `Gerenciar projetos` e `Editar página inicial`.
- A continuação imediata aplicou a mesma regra nas listagens: `src/app/admin/orders/page.tsx` e `src/app/admin/users/page.tsx` trocaram `Abrir` por `Ver pedido` e `Ver usuário`, deixando a ação final das tabelas mais direta.
- A passada seguinte levou o mesmo refinamento para o cockpit e para o detalhe de usuário: `src/app/admin/page.tsx` trocou `Abrir pedidos` e `Abrir editorial` por CTAs mais diretas, e `src/app/admin/users/[id]/page.tsx` alinhou `Abrir pedido` para `Ver pedido`.
- A continuação imediata refinou os toggles de `settings`: `src/app/admin/settings/page.tsx` trocou `Abrir` e `Fechar` por `Expandir` e `Recolher`, deixando a ação das sanfonas mais descritiva.
- A passada seguinte fechou mais dois verbos genéricos de apoio: `src/app/admin/webhooks/page.tsx` trocou `Abrir detalhes` por `Ver detalhes`, e `src/app/admin/_components/admin-support-email.client.tsx` deixou o botão mais explícito com `Salvar email`.
- A continuação imediata levou a mesma regra ao catálogo: `src/app/admin/products/[slug]/page.tsx` trocou `Salvar` por `Salvar livro`, e `src/app/admin/products/categories/page.tsx` alinhou a ação local para `Salvar nome`.
- A passada seguinte fechou mais um verbo genérico em mídia administrativa: `src/app/admin/products/_components/admin-image-url-list.client.tsx` trocou `Fechar` por `Fechar prévia` no modal de imagem ampliada.
- A continuação imediata refinou mais alguns submits genéricos: páginas editoriais como `about`, `contact`, `home` e `sarau-safado` passaram a nomear explicitamente o destino salvo, e `src/app/admin/_components/admin-shipping-providers.client.tsx` trocou `Salvar provedores` por `Salvar frete`.
- A passada seguinte levou a mesma clareza para promoções e coleções editoriais: `src/app/admin/promotions/page.tsx` trocou `Salvar alterações` por `Salvar promoção`, enquanto `src/app/admin/editorial/events/page.tsx` e `projects/page.tsx` deixaram de usar `Editar` isolado.
- A continuação imediata aplicou a mesma regra no catálogo: `src/app/admin/products/page.tsx` e `src/app/admin/products/_components/admin-variants-panel.client.tsx` passaram a usar `Editar livro` e `Editar variante` em vez de `Editar` solto.
- A passada seguinte fechou um detalhe de consistência no hub editorial: `src/app/admin/editorial/page.tsx` alinhou `Sarau Safado` ao mesmo padrão das demais páginas institucionais, agora com gramática natural em `pt-BR`, como `Editar página do Sarau Safado`.
- A continuação imediata levou essa consistência para dentro dos formulários: `src/app/admin/editorial/_components/editorial-about-form.tsx`, `editorial-contact-form.tsx` e `editorial-sarau-form.tsx` passaram a usar `Editar página ...` nos títulos internos.
- A passada rápida seguinte refinou o vocabulário do catálogo e do painel: `src/app/admin/products/new/page.tsx`, `product-form-fields.tsx`, `src/app/admin/promotions/page.tsx` e `src/app/admin/page.tsx` trocaram resíduos genéricos como `produto`, `Pré-visualizar`, `Multimoeda` e labels excessivamente técnicas por `livro`, `Ver loja`, `Mais de uma moeda` e microcopy mais operacional.
- A continuação imediata enxugou também painéis de auditoria e preview: `src/app/admin/email-templates/page.tsx`, `email-templates-preview.client.tsx`, `src/app/admin/emails/page.tsx` e `src/app/admin/webhooks/page.tsx` trocaram helpers vagos ou redundantes por textos mais úteis para operação e removeram badges que não acrescentavam contexto real.
- A passada seguinte refinou settings e telas de criação do admin: `src/app/admin/_components/admin-oauth-providers.client.tsx`, `admin-shipping-providers.client.tsx`, `settings/page.tsx`, `products/page.tsx`, `products/new/page.tsx` e as telas `editorial/.../new` trocaram placeholders mais técnicos e notas genéricas como `Fluxo` por instruções naturais como `Como usar`, `Visão rápida`, `ID informado pelo provedor` e `Valor salvo`.
- A continuação imediata fechou também um detalhe de unidade e entrada monetária: `src/app/admin/_components/admin-shipping-providers.client.tsx`, `promotions/page.tsx`, `variant-price-fields.client.tsx` e `product-form-fields.tsx` passaram a explicar melhor quando um valor ainda usa centavos internamente e a mostrar exemplos decimais mais claros na copy visível.
- A passada seguinte refinou também a leitura de detalhes e edição: `src/app/admin/orders/[id]/page.tsx`, `users/[id]/page.tsx`, `users/page.tsx`, `orders/_components/update-fulfillment.client.tsx` e `products/[slug]/page.tsx` trocaram títulos e helpers mais pesados por linguagem mais direta e menos técnica.
- A continuação imediata levou a mesma regra para o hub editorial e suas páginas: `src/app/admin/editorial/page.tsx`, `events/page.tsx`, `projects/page.tsx`, `about/page.tsx`, `contact/page.tsx`, `sarau-safado/page.tsx`, `home/page.tsx`, `events/[slug]/page.tsx`, `projects/[slug]/page.tsx` e `editorial-meta-card.tsx` trocaram descrições mais narrativas por copy mais curta, concreta e orientada ao site.
- A passada seguinte refinou também dashboard e logs: `src/app/admin/page.tsx`, `emails/page.tsx`, `emails/_components/email-log-table.client.tsx` e `webhooks/page.tsx` trocaram termos mais pesados por linguagem mais curta e direta, como `nova tentativa`, `envios recentes`, `saúde da operação` e `filtro atual`.
- A continuação imediata levou a mesma limpeza para componentes compartilhados e formulários editoriais: `admin-support-email.client.tsx`, `admin-regional-settings.client.tsx`, `editorial-event-form.tsx`, `editorial/events/new/page.tsx` e `editorial/projects/new/page.tsx` trocaram explicações mais longas por frases mais diretas sobre site, lista, resumo e revisão de imagem.
- A passada seguinte fechou mais alguns resíduos de linguagem pesada em `settings`, `frete`, `dashboard`, `pedidos`, `catálogo`, `usuários` e `modelos de email`, trocando termos como `fallback`, `evento auditável`, `assinatura operacional`, `recorte atual` e descrições longas por versões mais curtas como `reserva`, `registro`, `assinatura` e `filtro atual`.
- A continuação imediata refinou o detalhe de usuários e o card regional de `settings`, removendo `Defaults`, encurtando a descrição principal do perfil e trocando `Gestão interna` por `Ações sensíveis` para deixar a leitura mais direta.
- A passada seguinte saiu do miolo do admin para fechar resíduos percebidos em superfícies compartilhadas: `messages/pt-BR.json`, `messages/en-US.json` e `messages/es-ES.json` trocaram um toast técnico de checkout por linguagem voltada à pessoa usuária, removeram o `TODO` restante do resumo da conta em espanhol e alinharam o CTA de retorno para `Voltar para a loja` / `Back to store` / `Volver a la tienda`.
- Na continuação imediata, o repositório também foi limpo de dois arquivos órfãos de tradução, `messages/en-US 2.json` e `messages/pt-BR 2.json`, que ainda carregavam copy antiga da Goal 4 sem qualquer referência no código.
- A passada seguinte atacou um vazamento estrutural de idioma em fluxos compartilhados: `src/ui/profile-editor.client.tsx` e `src/ui/payment-methods-manager.client.tsx` deixaram de priorizar `error` cru da API para casos genéricos e passaram a responder pela camada local de tradução; na mesma rodada, `messages/pt-BR.json`, `messages/en-US.json` e `messages/es-ES.json` ganharam a chave específica de `email já em uso` no perfil.
- A continuação imediata fechou o microfluxo de favoritos: `src/ui/favorites/favorite-toggle.client.tsx` deixou de usar `aria-label` e erro hardcoded em português, enquanto `src/app/api/user/favorites/route.ts` passou a devolver `code` estável junto do erro, reduzindo drift futuro entre UI e backend.
- A passada seguinte voltou aos fluxos de autenticação compartilhados: `src/app/reset-password/page.tsx` saiu do hardcode em português e passou a usar uma namespace própria de i18n, `src/ui/auth/oauth-completion-form.client.tsx` deixou de priorizar erro cru da API e `src/ui/auth/register-form.client.tsx` passou a mapear conflito de email para a tradução local, em vez de exibir a mensagem vinda do backend.
- A continuação imediata endureceu contratos de borda fora do admin: `src/app/api/address/postal-lookup/route.ts`, `src/app/api/auth/email-available/route.ts` e `src/app/api/cart/route.ts` passaram a devolver `code` estável junto dos erros, reduzindo o acoplamento futuro da UI a frases específicas em inglês.
- A passada seguinte refinou também a microcopy pública das locales ativas: newsletter, recuperação de senha, cadastro, perfil e formas de pagamento trocaram fórmulas mais secas como `Falha ao...` / `Failed to...` por mensagens mais humanas e orientadas à ação.
- A continuação imediata fechou outro vazamento estrutural no perfil: `src/ui/profile-editor.client.tsx` deixou de ecoar `error` cru da rota de reenvio de verificação, enquanto `src/app/api/auth/resend-verification/route.ts` passou a devolver `code` estável para falhas e estados não autorizados.

## Critérios de aceite

- Nenhuma rota principal do admin abre com erro de runtime no console.
- O admin segue de forma consistente o idioma padrão resolvido pelo ambiente/configuração, sem alternar acidentalmente entre inglês legado e `pt-BR`.
- O admin deixa de expor configuração de moeda nesta fase e passa a assumir apenas a moeda vinda do ambiente.
- Campos administrativos recorrentes passam a oferecer autoformatação útil e previsível, reduzindo erro de preenchimento.
- `products`, `settings` e `email-templates` passam a parecer parte do mesmo sistema editorial do restante do backoffice.
- Hubs e estados vazios ajudam a pessoa operadora a decidir o próximo passo sem depender de memória do sistema.
- O `goal4` vira a referência para a próxima rodada de implementação do admin.
- A passada seguinte fechou mais uma borda estrutural da Goal 4: `src/app/api/auth/register/route.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/oauth/complete/route.ts`, `src/app/api/users/route.ts` e `src/app/api/users/[id]/route.ts` passaram a devolver `code` estável nas falhas e removeram resíduos híbridos como `Invalid ID` e `Not found`.
- A continuação imediata levou a mesma limpeza para rotas operacionais do admin: `src/app/api/admin/media/upload/route.ts`, `src/app/api/admin/media/delete/route.ts`, `src/app/api/admin/emails/[id]/retry/route.ts`, `src/app/api/admin/orders/[id]/fulfillment/route.ts` e `src/app/api/admin/settings/route.ts` passaram a responder em `pt-BR` claro e com `code` estável, sem resíduos como `No changes`, `Invalid status` ou mensagens da Cloudinary em inglês.
- A passada seguinte removeu também o último resíduo estrutural de moeda no frete: `src/app/api/admin/settings/route.ts`, `src/lib/settings.ts`, `src/lib/shipping-provider-presets.ts` e `src/lib/shipping.ts` deixaram de aceitar, persistir ou priorizar `currency` por provedor, e as cotações desta fase passaram a assumir apenas a moeda do ambiente.
- A continuação imediata limpou também os fallbacks lexicais do frete: `src/lib/shipping.ts`, `src/lib/shipping-core.ts` e `src/app/api/admin/settings/route.ts` trocaram resíduos como `Store pickup`, `Pick up at the store`, `Provider 1` e `No shipping providers configured` por equivalentes operacionais em `pt-BR`.
- A passada seguinte fechou também vazamentos em ações administrativas: `src/app/admin/users/actions.ts` saiu dos erros em inglês para gestão de papel e bloqueio, e `src/app/admin/orders/_components/update-fulfillment.client.tsx` passou a priorizar o `error` estruturado da rota ao salvar a expedição.
- A continuação imediata fechou também um vazamento direto na leitura de usuários: `src/app/admin/users/[id]/page.tsx` deixou de exibir papéis crus como `ADMIN` e passou a usar rótulos operacionais com `StatusBadge` no histórico de compras; na mesma rodada, `src/app/admin/_components/admin-shipping-providers.client.tsx` refinou headings e pills do bloco de frete para uma leitura mais natural.
- A passada seguinte refinou o cockpit de e-mails do admin: `src/app/admin/emails/page.tsx` e `emails/_components/email-log-table.client.tsx` alinharam a grafia visível para `E-mail`, trocaram `Falhos` por `Com falha`, suavizaram `Erro de envio` para `Falha de envio` e deixaram o preview em texto com nomenclatura mais natural.
- A continuação imediata levou a mesma linguagem ao monitoramento de integrações: `src/app/admin/webhooks/page.tsx` trocou `Rastreamento de webhooks` por `Recebimento de webhooks` e passou a usar `Com falha` em filtros e métricas de revisão.
- A passada seguinte fechou a grafia de `e-mail` em navegação e preview: `src/app/admin/_components/nav-config.ts`, `src/app/admin/email-templates/page.tsx` e `email-templates/_components/email-templates-preview.client.tsx` alinharam labels, título e helper para `E-mails` e `Modelos de e-mail`.
- A continuação imediata fechou mais resíduos diretos no dashboard e em promoções: `src/app/admin/page.tsx` e `src/app/admin/promotions/page.tsx` passaram a usar `E-mails`, `Cliente sem e-mail`, `Falhas de e-mail`, `Inspecionar e-mails`, `Exige e-mail verificado` e `fila de e-mail`, além de remover a explicação introdutória sobre moeda do card de nova promoção.
- A passada seguinte fechou também a moldura de `email-templates`: `src/app/admin/email-templates/page.tsx` alinhou o eyebrow para `E-mails`, evitando drift com a navegação e com o título da própria tela.
- A continuação imediata fechou mais resíduos dessa mesma família em `src/app/admin/_components/admin-support-email.client.tsx`, `src/app/admin/email-templates/page.tsx`, `src/app/admin/_components/admin-oauth-providers.client.tsx`, `src/app/admin/emails/_components/email-log-table.client.tsx` e `src/app/admin/settings/page.tsx`: suporte, logs, preview e ajuda de OAuth passaram a usar `E-mail` com grafia consistente, e o bloco de frete deixou de mencionar `moeda` até na descrição auxiliar.
- A passada seguinte levou essa limpeza para filtros e tabelas: `src/app/admin/emails/page.tsx`, `src/app/admin/users/page.tsx` e `src/app/admin/users/[id]/page.tsx` passaram a usar `Confirmação de e-mail`, `Com falha` e `E-mail` de forma consistente nas telas de listagem e detalhe.
- A continuação imediata fechou também um detalhe de CTA no catálogo: `src/app/admin/products/_components/admin-variants-panel.client.tsx` trocou `Arquivar` por `Arquivar variante`, deixando a ação destrutiva explícita no mesmo padrão das demais ações contextuais.
- A passada seguinte limpou também a linguagem de mídia no editorial: `src/app/admin/editorial/events/page.tsx`, `editorial-sarau-form.tsx`, `editorial-event-form.tsx`, `editorial-about-form.tsx`, `editorial-home-form.tsx`, `editorial-project-form.tsx` e `src/app/admin/products/_components/admin-image-url-list.client.tsx` trocaram `Upload` por `Imagem` e removeram a explicação técnica sobre reaproveitar o fluxo de produtos.
- A continuação imediata refinou também telas de inspeção: `src/app/admin/webhooks/page.tsx`, `src/app/admin/orders/[id]/page.tsx` e `src/app/admin/orders/_components/update-fulfillment.client.tsx` passaram a usar `Cabeçalhos da requisição`, `Conteúdo recebido`, `E-mail do cliente`, `Sessão de checkout` e `Expedição salva` para reduzir jargão técnico na revisão diária.
- A passada seguinte fechou mais alguns resíduos de mesma família em `src/app/admin/page.tsx`, `src/app/admin/orders/[id]/page.tsx` e `src/app/admin/products/[slug]/page.tsx`: `Falhas de webhook` virou `Falhas no recebimento`, o histórico de pedido passou a falar em `evento recebido` e `automação de recebimento`, e o detalhe de catálogo ganhou `Histórico do livro` com estado vazio mais contextual.
- A continuação imediata refinou também rótulos de cards e detalhes: `src/app/admin/page.tsx`, `src/app/admin/promotions/page.tsx`, `src/app/admin/orders/page.tsx` e `src/app/admin/emails/_components/email-log-table.client.tsx` passaram a usar `Recebimento`, `Formato do desconto`, `E-mail do cliente` e `Tipo da mensagem` em vez de labels mais genéricas ou técnicas.
- A passada seguinte fechou mais três detalhes rápidos de orientação: `src/app/admin/products/categories/page.tsx`, `src/app/admin/emails/page.tsx` e `src/app/admin/page.tsx` passaram a usar `Catálogo integrado`, `Criada no admin`, `tipo da mensagem` na busca e o CTA `Ver recebimento` no painel de confiabilidade.
- A continuação imediata refinou também componentes compartilhados em `src/app/admin/admin-filters.client.tsx`, `src/ui/status-badge.tsx`, `src/app/admin/emails/page.tsx` e `src/app/admin/webhooks/page.tsx`: filtros e badges passaram a usar `Ação necessária`, `Com falha`, `Sem status definido` e `Sem tipo informado`, e o estado vazio de recebimento ficou menos preso ao termo `webhook`.
- A passada seguinte levou a mesma consistência para a navegação persistente: `src/app/admin/_components/nav-config.ts` e `src/app/admin/webhooks/page.tsx` passaram a usar `Recebimento` como label principal também na sidebar, na navegação mobile e no eyebrow da tela.
- A passada seguinte fechou também dois fallbacks restantes do mesmo bloco: `src/ui/status-badge.tsx` deixou de cair em `Indefinido`, e `src/app/admin/emails/page.tsx` alinhou a opção `unknown` para `Sem tipo informado`.
- A continuação imediata refinou também a shell compartilhada do admin: `messages/pt-BR.json` e `messages/en-US.json` passaram a usar `Navegação`, `Conta atual`, `Sessão ativa`, `Abrir navegação`, `Navegação do admin` e `Voltar para a loja`, deixando `painel editorial` restrito ao subtítulo da marca.
- A passada seguinte refinou também a ergonomia monetária do catálogo: `src/app/admin/products/_components/product-form-fields.tsx` e `variant-price-fields.client.tsx` passaram a aceitar vírgula na digitação de preço, normalizar o valor no próprio input e abrir os defaults já no formato local, reduzindo erro de preenchimento em livro e variante.
- A continuação imediata fechou também dois resíduos de copy técnica no catálogo: `src/app/admin/products/_components/admin-image-url-list.client.tsx` trocou `armazenamento configurado` por `biblioteca de mídia`, e `src/app/admin/products/page.tsx` deixou de exibir erro cru do provider ao falhar o carregamento da lista.
- A passada seguinte refinou também o índice editorial: `src/app/admin/editorial/page.tsx`, `events/page.tsx` e `projects/page.tsx` trocaram contagens placeholder como `item(ns)` por resumos naturais e deixaram os acessos rápidos mais precisos, com CTAs como `Ver painel editorial`, `Ver eventos` e `Ver projetos`.
- A continuação imediata fechou também a lateral de inspeção de e-mails: `src/app/admin/emails/_components/email-log-table.client.tsx` passou a usar `canal de envio`, `modelo do e-mail`, `histórico de tentativas` e feedback de reenvio pelo canal, além de alinhar a aba principal para `Prévia do e-mail`.
- A passada seguinte refinou também os fallbacks de auditoria e metadata: `src/app/admin/orders/[id]/page.tsx` deixou de expor papéis crus no histórico e passou a rotular a origem como `Automação`, `Administrador`, `Vendedor` ou `Cliente`, enquanto `src/app/admin/editorial/_components/editorial-meta-card.tsx` trocou `Sistema` por `Atualização automática`.
- A continuação imediata ajustou também detalhes compactos da inspeção de e-mails: `src/app/admin/emails/_components/email-log-table.client.tsx` passou a usar `Situação do pedido`, `Origem do envio` e `Não informado` em vez de labels mais secas ou ambíguas.
- A passada seguinte refinou também fallbacks de moldura em promoções e modelos: `src/app/admin/promotions/page.tsx` passou a usar `Sem data informada`, `Sem regra adicional`, separador ` · ` nas regras e `Sem resumo informado`, enquanto `src/app/admin/email-templates/page.tsx` e `email-templates-preview.client.tsx` alinharam `Não informado` e `Modelo em revisão`.
- A continuação imediata fechou também microfallbacks recorrentes no catálogo e em e-mails: `src/app/admin/orders/[id]/page.tsx`, `product-form-fields.tsx`, `admin-variants-panel.client.tsx`, `src/app/admin/emails/page.tsx` e `email-log-table.client.tsx` passaram a usar `Não informado`, `Usa o resumo do livro.` e `Assunto não informado` em vez de resíduos mais secos como `Não definido`, `Sem descrição` e `Sem assunto`.
- A passada seguinte refinou também microfallbacks de galeria, variantes e recebimento: `product-form-fields.tsx`, `admin-variants-panel.client.tsx`, `admin-product-image-preview.tsx`, `promotions/page.tsx` e `webhooks/page.tsx` passaram a usar `Categoria não informada`, `Ordem automática`, `Sem imagem disponível`, `Sem cupom`, `Assinatura validada` e `Assinatura sem validação`.
- A continuação imediata fechou também estados vazios do catálogo em lista e galeria: `admin-image-url-list.client.tsx`, `products/page.tsx` e `products/categories/page.tsx` passaram a usar `Sem imagem disponível`, `Categoria não informada` e `Nenhuma categoria disponível neste momento`.
- A passada seguinte eliminou também traços soltos em detalhes e coleções de uso recorrente: `src/app/admin/users/page.tsx`, `users/[id]/page.tsx`, `orders/[id]/page.tsx`, `products/[slug]/page.tsx`, `editorial/events/page.tsx`, `editorial/events/[slug]/page.tsx`, `editorial/projects/page.tsx` e `editorial/projects/[slug]/page.tsx` passaram a usar fallbacks como `Nome não informado`, `Telefone não informado`, `Item sem nome informado`, `Valor não informado`, `Categoria não informada` e `Não informado` no lugar de `—`.
