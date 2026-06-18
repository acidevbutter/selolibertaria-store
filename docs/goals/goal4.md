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

## Critérios de aceite

- Nenhuma rota principal do admin abre com erro de runtime no console.
- O admin segue de forma consistente o idioma padrão resolvido pelo ambiente/configuração, sem alternar acidentalmente entre inglês legado e `pt-BR`.
- O admin deixa de expor configuração de moeda nesta fase e passa a assumir apenas a moeda vinda do ambiente.
- Campos administrativos recorrentes passam a oferecer autoformatação útil e previsível, reduzindo erro de preenchimento.
- `products`, `settings` e `email-templates` passam a parecer parte do mesmo sistema editorial do restante do backoffice.
- Hubs e estados vazios ajudam a pessoa operadora a decidir o próximo passo sem depender de memória do sistema.
- O `goal4` vira a referência para a próxima rodada de implementação do admin.
