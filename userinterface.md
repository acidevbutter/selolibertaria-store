# User Interface

## Fonte canônica

- O documento principal de padrões visuais continua sendo `UI_UX_PATTERNS.md`.
- O inventário funcional que deve orientar briefings de UI/UX fica em `spec.md`.
- Este arquivo resume decisões de interface que precisam ser consultadas rapidamente durante mudanças de UI.
- A baseline atual da marca é propositalmente genérica, com placeholder visual neutro e fácil substituição posterior.

## Direção visual do rebrand Selo Libertária

- A direção preferencial atual é `Editorial Noturno`.
- A variante em implementação para este redesign é `Editorial V2`, mais clara e tátil: papel `#F7F4EF`, preto `#0B0B0B`, vinho seco `#7A1E22`, bege envelhecido `#D8D0C4`, serifas editoriais, cards com borda reta e mais espaço em branco.
- Isso pede paleta quente e profunda, contraste alto, composição editorial e sensação adulta.
- Evitar visual infantil, fofo, pop colorido, excesso de brilho ou referência explícita de sex shop.
- Tipografia deve combinar uma serifada marcante para títulos com uma sans limpa para navegação, ficha técnica e compra.
- O site deve parecer uma livraria-editora cultural contemporânea antes de parecer um template de e-commerce.

## Home do rebrand

- A home deve começar com uma dobra de alto impacto visual e copy curta.
- A primeira CTA é comercial; a segunda CTA é cultural.
- Blocos da home devem alternar produto, manifesto, agenda/projetos e prova visual.
- Capas, retratos e fotos de performance devem receber mais protagonismo do que ícones ou ilustrações genéricas.
- O wireframe-base da home é: header editorial, hero híbrido, vitrine de livros, manifesto, agenda/projetos, seção visual, bloco autora/selo, fechamento comunitário e footer.
- No desktop, o hero deve se comportar como uma capa editorial ampla; no mobile, como uma pilha elegante de copy, CTA e imagem.
- Na iteração atual da Goal 3, o hero deve usar CTA primária clara, título com escala mais próxima do Figma, quadro principal de capa à direita e reveals curtos por bloco para adicionar acabamento sem ruído.
- A densidade da home deve variar intencionalmente: hero forte, vitrine curada, manifesto respirado, agenda/projetos médios, mosaico imersivo e fechamento leve.
- A implementação ideal da home deve ser modularizada em componentes próprios de `src/ui/home/`, deixando `src/app/(store)/page.tsx` como composição limpa de seções.

## Páginas institucionais do Selo Libertária

- `events`, `projects` e `sarau-safado` devem parecer capítulos editoriais, não somente repositórios de cards.
- O padrão preferencial é: entrada forte, bloco curatorial de apoio, listagem principal com melhor hierarquia interna e fechamento com links de continuidade.
- Na iteração atual da Goal 3, as páginas institucionais devem herdar a mesma linguagem de motion da home, com heróis mais firmes, cards editoriais com hover lift leve e entradas em cascata discretas.
- Na fase concluída da Goal 3, `products`, `search` e `category/[slug]` também devem abrir com o mesmo enquadramento editorial: eyebrow, título forte, descrição curta, bloco curatorial lateral e três cards de apoio antes da grade.
- No `Sarau Safado`, a imagem enviada no hero pelo admin deve virar a capa de fundo da abertura, enquanto eyebrow, título e texto ficam sobrepostos em um bloco de alto contraste ancorado na própria imagem.
- Quando a página tiver muitos textos corridos, dividir título/resumo e descrição em áreas distintas dentro do mesmo card melhora ritmo e escaneabilidade.

## Footer da DevButterStore

- Manter a estrutura atual do footer, com newsletter, navegação auxiliar, copyright e métodos de pagamento.
- Quando houver assinatura de desenvolvimento, usar lockup inline na faixa inferior com texto, ícone e nome visível da marca.
- A assinatura deve ser discreta, legível e alinhada ao restante do footer, sem disputar atenção com CTAs ou pagamentos.

## Checkout processing

- A tela de processamento pós-checkout não deve aprisionar a pessoa usuária em loading infinito.
- O spinner pode existir apenas durante uma espera curta por confirmação; depois disso, a interface deve trocar para um aviso estático e claro, sem mudar a estrutura visual principal da página.

## Entrega no checkout

- O checkout precisa pedir a escolha de entrega antes do pagamento.
- A opção de endereço cadastrado, novo endereço e retirada na loja devem aparecer no mesmo bloco, com leitura comparável.
- O resumo da entrega deve mostrar prazo e valor estimado ao lado da opção escolhida.
- O formulário de novo endereço deve reaproveitar os campos já existentes no produto, sem duplicar padrões visuais.

## Frete

- Quando a cotação de frete entrar no checkout, o bloco deve ficar legível antes do total final e usar cards ou radios simples para comparação rápida.
- A interface deve deixar claro quando o provedor está indisponível, sem expor erro técnico bruto na tela.

## Cards de produto

- Cards de produto da DevButterStore devem usar cantos retos, borda suave e sombra discreta, com hover elevando levemente o bloco.
- Todos os cards da selolibertaria devem compartilhar o mesmo formato e a mesma altura visual.
- A imagem do produto deve se adaptar ao quadro fixo do card, sem definir o tamanho externo do componente.
- O título do produto no card deve ter mais destaque do que o preço-base e permanecer confortável para leitura em duas linhas.
- O botão de favorito permanece flutuante no topo direito.
- A CTA principal do card deve ser compacta e flutuante no canto inferior direito, usando somente `+` em repouso e expandindo para `Add to cart` no hover com animação suave de pelo menos `1s`; no estado expandido vermelho, o texto deve ficar preto.
- Em telas com hover, a CTA expande com transição fluida; em telas por toque, ela deve permanecer visível o tempo todo.
- Quando houver variantes, os chips abaixo do preço devem funcionar como seletor da opção que o `+` irá adicionar; o chip ativo pode expandir levemente e usar texto preto sobre vermelho.
- Enquanto a loja estiver em modo genérico, evitar elementos visuais altamente temáticos em logos, capas e blocos institucionais.
- No rebrand do Selo Libertária, o card pode usar uma linha curta de microcopy abaixo do título para aproximar a vitrine de uma prateleira curada.

## Catálogo e PDP do Selo Libertária

- A listagem deve abrir com um enquadramento editorial curto antes da grade.
- No backoffice editorial, a interface deve reutilizar o idioma visual dos formulários de produto: cards claros, seções curtas, upload-first para imagem e blocos repetíveis simples para preservar velocidade de edição.
- O editorial admin também deve oferecer um ponto de entrada central e uma sidebar curta de metadados operacionais, para que edição e contexto coexistam sem parecer uma tela técnica excessiva.
- Em páginas institucionais editáveis, a UI de admin deve espelhar a composição pública por blocos: hero, conteúdo principal, cards, links e fechamento. Isso torna a manutenção mais intuitiva do que um editor textual genérico.
- Na home editável, a interface de admin deve deixar claro o limite entre blocos institucionais e blocos dinâmicos do produto: hero, manifesto, autora e CTA final são editáveis ali; vitrine, eventos e projetos continuam respondendo às suas próprias fontes.
- Em uploads do admin editorial, o campo deve comunicar o estado sem ambiguidade: botão de seleção, prévia local e aviso curto de que o arquivo será enviado ao salvar, em vez de depender de upload silencioso logo após a escolha.
- Em uploads administrativos por arquivo, a prévia principal deve abrir em modal de confirmação com ações claras de `Salvar` e `Descartar`, para que a pessoa valide visualmente a mídia antes de mantê-la no formulário ou iniciar o envio.
- Em `/admin` e `/login`, nenhuma camada global transitória deve ficar por cima dos controles. Backoffice e autenticação precisam estar clicáveis assim que a rota renderizar.
- Em listas editoriais com ordenação, a interface deve expor controles pequenos e diretos de subir/descer na própria linha do item, para que a pessoa operadora ajuste sequência sem abrir a tela de edição.

## Login do Selo Libertária

- A tela de login deve seguir a linguagem `Editorial V2` do restante da DevButterStore, com header editorial, superfície de papel e protagonista visual ligado a livro/capa.
- Evitar o padrão de card centralizado isolado sobre fundo neutro; a página inteira deve compor o enquadramento do login.
- O layout preferencial no desktop é assimétrico em duas colunas: texto e formulário à esquerda, capa/livro em painel escuro à direita.
- Inputs e botões devem usar cantos retos e bordas discretas, com a CTA principal em preto profundo e trilho social alinhado logo abaixo.
- O bloco visual da direita deve parecer capa ampliada ou cartaz editorial, e pode receber uma citação curta sobreposta como elemento de ritmo.
- Quando a pessoa optar por criar conta nessa mesma superfície, o cadastro deve migrar para um fluxo em etapas, com indicador de progresso editorial e apenas um grupo lógico de campos por vez.
- A PDP deve preservar foco de compra no topo, mas ganhar camadas adicionais abaixo da dobra para contexto e continuidade.
- Na iteração atual da Goal 3, a PDP deve ampliar o contraste editorial entre galeria, título, CTAs e bloco de citação, além de usar microinterações leves de hover/reveal para manter a página viva sem competir com a compra.
- A grade pública de livros deve entrar em cascata leve com `Reveal`, mantendo o hover principal dentro do próprio card; evitar empilhar múltiplos lifts na mesma interação para não transformar a vitrine em uma superfície nervosa.

## Admin

- A interface do backoffice deve esconder entradas e ações que o papel logado não pode usar, especialmente na futura diferenciação entre `admin` e `vendor`.
- No shell administrativo editorial, a barra lateral deve permanecer preta, fixa e com largura estável, enquanto a área de trabalho usa papel claro e largura ampla para não parecer um dashboard SaaS genérico.
- No redesign guiado pelo Figma do admin, o shell deve reforçar um contraste simples e adulto: sidebar preta com logotipo textual em caixa alta, links estreitos em uppercase, área principal em papel claro e cards com cantos retos.
- Na iteração atual da Goal 2, o shell desktop do admin passa a seguir o cockpit refinado do Figma: largura de `264px`, marca com bloco claro de `44px`, subtítulo `admin editorial`, navegação em pills de canto arredondado com ponto vinho no item ativo e rodapé enxuto de sessão abaixo de divisor curto.
- No mobile, o menu lateral deve repetir a mesma hierarquia do desktop dentro do sheet, evitando ícones ruidosos e mantendo os links como pills claras sobre fundo preto.
- Títulos de operação do admin devem priorizar leitura clara; a expressão tipográfica mais dramática da marca pode aparecer no logo e em acentos, mas não deve esmagar blocos analíticos longos.
- As páginas-base do admin devem abrir com um hero editorial curto antes dos blocos funcionais; filtros, ações primárias e KPIs entram logo abaixo desse hero, não dispersos em cabeçalhos pequenos.
- No dashboard `/admin`, o hero curto agora deve funcionar como topbar operacional: título em sans forte, descrição curta, CTAs compactas à direita, faixa de filtros logo abaixo e um cockpit com quatro métricas principais, fila de ação e coluna auxiliar de preview/atividade.
- Na continuação atual da Goal 2, páginas legadas como `emails`, `webhooks` e `users` devem herdar esse mesmo enquadramento: hero editorial curto, métricas na abertura e bloco principal mais sóbrio para tabela ou auditoria.
- Na mesma trilha da Goal 2, superfícies de revisão e taxonomia como `email-templates`, `products/categories`, `editorial/events` e `editorial/projects` devem seguir a mesma abertura com hero curto, cards de contexto e corpo principal claramente separado entre ações rápidas e conteúdo denso.
- Na Goal 4 do admin, a consistência de idioma vira regra de interface: labels, help text, CTAs, placeholders e estados vazios devem seguir o idioma padrão resolvido pela aplicação, sem telas híbridas metade em inglês e metade em `pt-BR`.
- Na passada atual da Goal 4, `settings`, `promotions` e os formulários de produto devem preferir rótulos curtos em `pt-BR`, mensagens de status igualmente em `pt-BR` e larguras máximas menores por campo, para que o formulário pareça calibrado para cada dado em vez de usar inputs longos por padrão.
- Em taxonomias e cadastros de produto da Goal 4, evite expor termos de infraestrutura quando não ajudam a operação: origem de categoria deve aparecer como `Catálogo` ou `Manual`, e mensagens de falha devem priorizar contexto operacional em vez de citar Stripe sem necessidade.
- Em `admin/promotions`, mesmo os blocos apenas informativos devem assumir a moeda do ambiente; helpers, subtotais mínimos e cards de resumo não devem cair em `BRL` hardcoded quando a aplicação já resolve `STRIPE_CURRENCY`.
- Em `admin/email-templates`, a biblioteca lateral deve permitir busca curta, expor categoria por template e manter a prévia principal isolada em um quadro branco grande, com email de suporte destacado como metadado operacional sem depender de carregamento client-side tardio.
- Em tabelas e painéis de auditoria do admin, labels técnicos podem existir, mas precisam entrar traduzidos e contextualizados: prefira `ID do evento`, `Assinatura validada`, `Abrir detalhes` e `Sem imagem` a valores crus de implementação quando isso não sacrificar diagnóstico.
- O mesmo vale para microdetalhes de preview e modais: `ID da mensagem`, títulos de `iframe` e textos de fallback de imagem também devem seguir `pt-BR`, porque esses pontos viram ruído perceptível quando o restante da tela já está consistente.
- Componentes compartilhados de estado também entram nessa regra: badges e tabelas-base do admin não devem depender de `capitalize` sobre status crus; a interface precisa renderizar estados prontos em `pt-BR` e formatar datas/valores com padrão local logo na base.
- Filtros compartilhados do admin entram no mesmo contrato: labels como `Período` e `Ordenação`, placeholders e opções de status precisam sair traduzidos de origem, com largura proporcional ao conteúdo esperado em vez de manter textos do starter em inglês.
- No dashboard do admin, a interface deve preferir palavras operacionais já conhecidas pela equipe, como `expedição`, `recebimento de eventos`, `prévia da loja` e `código de rastreio`, evitando expor `fulfillment`, `ingest`, `storefront` ou `tracking` quando não agregam diagnóstico.
- Em detalhes de pedido, o mesmo contrato continua valendo: títulos de bloco, labels de auditoria e botões de ação devem usar `expedição`, preservando `fulfillment` apenas na camada de implementação.
- Em formulários editoriais, campos de slug também devem receber autoformatação visível para kebab-case durante a digitação e no blur, mantendo o comportamento consistente com o editor de produto.
- No hub editorial e nas páginas institucionais do admin, a copy visível deve falar em `área pública` ou `site`; `storefront` não deve aparecer como default em helpers e stats.
- Em `admin/settings`, blocos de suporte e frete também entram na regra de ergonomia: email em minúsculas sem espaços extras, código do provedor normalizado, endpoints com barra inicial consistente e países suportados formatados como lista curta em maiúsculas.
- Labels de preset e credenciais de frete fazem parte da UI do admin e devem nascer em `pt-BR`; evitar cards com descrição operacional em português e campos-chave ainda em inglês.
- Essa mesma regra vale para OAuth: `ID do cliente` e `Segredo do cliente` devem aparecer localizados, e inputs de credenciais não devem sofrer capitalização ou autocorreção do navegador.
- Em `admin/promotions`, quando um campo depende de normalização server-side, a interface deve avisar isso de forma curta no próprio bloco. Código de cupom, slugs e listas de IDs não precisam parecer mágicos nem exigir tentativa e erro.
- Selects operacionais do backoffice também entram na revisão lexical: use `Teste` e `Produção` como opções visíveis para ambiente.
- Essa revisão lexical vale para labels de papéis e campos técnicos curtos: `Administrador`, `Vendedores` e `URL base` ficam mais coerentes com o restante do backoffice do que versões híbridas em inglês.
- O mesmo princípio vale para navegação persistente e textos de apoio: `Painel`, `Modelos de email` e helpers de login social em linguagem menos protocolar reduzem a sensação de starter parcialmente traduzido.
- O lockup fixo do shell administrativo também deve seguir esse acabamento: prefira `painel editorial` em vez de resíduos como `admin editorial`.
- Em `admin/settings`, a composição preferencial da Goal 4 é hero curto, trio de contexto e depois seções recolhíveis com título, descrição curta e conteúdo interno, evitando uma parede contínua de formulários com peso visual idêntico.
- Na mesma tela de `settings`, cards-resumo não devem reintroduzir conceitos já removidos da operação, como `moeda`; se a fase assume defaults vindos do ambiente, o resumo precisa falar de `idioma`, `país` e contexto regional.
- O seletor de idioma dentro de `settings` também precisa ser coerente com a própria interface: se o admin está em `pt-BR`, as opções devem aparecer localizadas em `pt-BR`, em vez de herdarem o idioma do browser da máquina.
- Na Goal 6 do admin, a navegação lateral deve deixar de existir como duas implementações paralelas; desktop e mobile precisam compartilhar a mesma fonte de verdade para item ativo, agrupamentos, ícone opcional, badge e copy de apoio.
- Na Goal 6 do admin, o shell não deve depender apenas de ponto + texto para toda a hierarquia; grupos, label secundária, estado ativo e contexto de sessão precisam comunicar localização sem competir com o conteúdo principal.
- Na Goal 6 do admin, o hero operacional do dashboard e das páginas-base deve preservar legibilidade tipográfica limpa em qualquer viewport, sem sobreposição visual nem áreas em branco acidentais causadas por motion ou composição.
- Nos detalhes de `users` e `orders` do admin, o primeiro bloco deve consolidar leitura rápida de contexto com hero curto e métricas; perfil, compras, fulfillment e auditoria ficam em painéis separados para evitar uma coluna longa e opaca.
- Na etapa atual da Goal 3, essas telas de detalhe do admin também devem usar reveals discretos por seção, preservando a sensação de acabamento do cockpit sem transformar o backoffice em uma interface animada demais.
- Perfis internos não devem receber affordances de compra na selolibertaria por regra de interface; mesmo assim, a proteção canônica continua sendo o bloqueio no servidor.
- No dashboard administrativo, KPIs executivos devem aparecer primeiro em cards compactos e comparáveis, seguidos por blocos separados de pagamento, fulfillment e saúde operacional.
- Estados que exigem atenção, como disputa, falha de email, webhook pendente ou pedido pago sem avanço operacional, devem receber destaque visual superior ao de métricas históricas neutras.
- Em gestão de usuários, ações de papel e bloqueio devem aparecer como controles administrativos explícitos, separados dos dados de perfil e visíveis apenas para `admin`.
- Em produtos do admin, o histórico de edição deve aparecer como uma seção separada e legível, abaixo do formulário principal, sem competir visualmente com a edição ativa.
- Em produtos do admin, criação e edição devem quebrar o formulário em seções curtas com títulos claros, em vez de empilhar todos os campos numa única sequência longa.
- O estado de disponibilidade em produto e variante deve usar rótulos de negócio como `Active` e `Deactivate`, sem termos internos como `Active in Stripe`.
- A área de variantes deve mostrar um resumo escaneável na página e usar modal para criar ou editar uma variante, preservando o contexto do produto.
- Em detalhes de pedido no admin, o histórico de auditoria deve aparecer como uma seção dedicada abaixo do resumo e dos itens, sem competir com a ação principal de fulfillment.
- No histórico de pedido do admin, cada alteração deve privilegiar leitura de auditoria com blocos de `Before` e `After`, evitando visualização crua em JSON sempre que houver estrutura conhecida.
- Em pedidos exibidos no admin e em superfícies do cliente, o identificador principal deve ser um `orderId` interno da aplicação, evitando expor `paymentIntentId` da Stripe como rótulo principal do pedido.
- Em frete, o admin precisa mostrar provedores, prioridade, status e última cotação válida em blocos curtos, sem misturar a política comercial com os detalhes técnicos da integração.
- No admin de frete, cada família de provider deve abrir apenas seus campos esperados, como token dos Correios, token da Jadlog ou API key da EasyPost, para reduzir erro de configuração.
- Em formulários administrativos da Goal 4, campos estruturados devem oferecer autoformatação visível e previsível, como slug normalizado, telefone e CEP mascarados e URLs/códigos com limpeza básica de entrada, sempre sem esconder o valor efetivamente persistido.
- Na mesma fase, o admin não deve expor seletor geral de moeda em settings: a interface assume somente a moeda definida pelo ambiente e evita prometer conversão antes da etapa final.
- O shell de login também faz parte desse contrato visual: hero, footer e links legais precisam respeitar a camada de i18n em vez de hardcodes locais, para não criar uma porta de entrada híbrida quando a aplicação resolver outro idioma.
- Na moldura de `email-templates`, use `Emails` e `Modelos` em vez de reaproveitar `Templates` em inglês quando a própria tela já se apresenta como `Templates de email`.
- Em `admin/users`, a tabela também não deve vazar papéis crus do domínio. A interface precisa listar `Administrador`, `Vendedor` e `Cliente` como rótulos visíveis, mantendo `admin` e afins apenas na camada de implementação.
- Em superfícies editoriais do admin, títulos e descrições também devem evitar anglicismos ou nomes híbridos desnecessários; `Página inicial` e `restante do admin` comunicam melhor do que `Home` e `backoffice` quando a tela toda já está em `pt-BR`.
- Esse cuidado vale também para hubs e formulários compartilhados do editorial: cards-resumo e títulos como `Editar página inicial` devem reforçar a mesma nomenclatura, sem alternar entre `Home` e `Página inicial`.
