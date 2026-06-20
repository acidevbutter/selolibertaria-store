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

## Critérios de aceite

- Nenhuma rota principal do admin abre com erro de runtime no console.
- O admin segue de forma consistente o idioma padrão resolvido pelo ambiente/configuração, sem alternar acidentalmente entre inglês legado e `pt-BR`.
- O admin deixa de expor configuração de moeda nesta fase e passa a assumir apenas a moeda vinda do ambiente.
- Campos administrativos recorrentes passam a oferecer autoformatação útil e previsível, reduzindo erro de preenchimento.
- `products`, `settings` e `email-templates` passam a parecer parte do mesmo sistema editorial do restante do backoffice.
- Hubs e estados vazios ajudam a pessoa operadora a decidir o próximo passo sem depender de memória do sistema.
- O `goal4` vira a referência para a próxima rodada de implementação do admin.
