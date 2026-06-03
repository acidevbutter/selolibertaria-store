# Technical Scope Spec

## Objetivo

Avançar somente nos requisitos técnicos da storefront, preservando a UI exatamente como está neste momento.

## Restrições

- Não alterar layout, hierarquia visual, tipografia, cores, componentes ou copy pública por iniciativa própria.
- Só aceitar mudanças visuais quando forem consequência inevitável de correções técnicas ou pedido explícito.

## Escopo permitido

1. Correções de renderização quebrada.
2. Ajustes de comportamento real de formulários e fluxos públicos.
3. Tratamento seguro de erro e fallback.
4. Consistência técnica de i18n, acessibilidade estrutural e integrações.
5. Registro de backlog técnico e critérios de validação.

## Fora de escopo

1. Polimento visual.
2. Reescrita de copy para fins de branding.
3. Redesign de home, footer, PDP, FAQ, About ou contato.

## Critério de aceite

Se a correção puder ser entregue sem mudar a aparência percebida da loja, ela está dentro do escopo atual.

## Ajuste técnico atual: timeout do pós-checkout

### Objetivo

Encerrar o estado de espera da tela `/checkout/processing` de forma previsível, sem deixar a pessoa usuária presa em carregamento contínuo.

### Regras

1. O polling do retorno do checkout deve durar no máximo `15s`.
2. Se não houver confirmação final nesse intervalo, a tela deve redirecionar automaticamente para `/user?section=purchases`.
3. Mensagens dessa etapa não devem citar o provedor de pagamento na interface.
4. Se o `payment_intent` já estiver confirmado, a UI de `/checkout/processing` deve encerrar a espera sem depender de nova volta do webhook para destravar a navegação.
5. Estados crus de disputa e revisão persistidos no histórico devem ser normalizados no dashboard e nas superfícies de pedidos para os grupos de produto `disputed`, `won` e `lost`.

## Ajuste técnico atual: auditoria automática de pedidos por webhook

### Objetivo

Registrar no histórico administrativo dos pedidos as mudanças automáticas de status aplicadas por webhook, com contexto suficiente para auditoria operacional.

### Regras

1. Toda mudança efetiva de `purchase.status` causada por webhook deve gerar uma entrada em `orderAuditLogs`.
2. A entrada deve registrar, no mínimo, `orderId`, `eventId`, `event.type`, status anterior, status novo, origem automática e timestamp.
3. O histórico na tela administrativa do pedido deve exibir essas mudanças lado a lado com as edições manuais, mas o dashboard não deve contar esses eventos como `manual touches`.

## Planejamento: Dashboard administrativo com métricas operacionais e financeiras

### Objetivo

Evoluir `src/app/admin/page.tsx` de um resumo simples para um painel executivo-operacional que ajude a loja a entender receita, saúde dos pedidos, gargalos de fulfillment, impacto de descontos e risco operacional sem depender de leitura manual de múltiplas telas do admin.

### Diagnóstico do estado atual

1. O dashboard atual usa uma amostra recente de usuários com compras, em vez de agregar o universo completo de pedidos filtrados.
2. As métricas principais se limitam a `Users`, `Revenue (paid)`, `Paid vs Failed`, compras filtradas e top customers.
3. O funil de pagamento está comprimido demais: estados importantes já persistidos no sistema, como `processing`, `requires_action`, `disputed`, `refunded` e estados de fulfillment, não aparecem com clareza.
4. A visão financeira não explora campos já presentes no modelo de pedido, como `pricing.subtotal`, `pricing.discountTotal`, `pricing.couponCode` e `refundedAmount`.
5. O dashboard não aproveita sinais operacionais já disponíveis em outras coleções, como `orderAuditLogs`, `webhooks` e `communication`.

### Fontes de dados já existentes no sistema

1. `users.purchases` para volume de pedidos, status, valor total, moeda, itens, pricing, ids relacionados e eventos Stripe.
2. `users.purchases.fulfillment` para fila operacional de `received`, `producing` e `shipped`.
3. `users.purchases.pricing` para subtotal base, desconto total, subtotal final e uso de cupom.
4. `users.purchases.refundedAmount` para leitura de devoluções ou ajustes financeiros.
5. `orderAuditLogs` para auditoria de alterações manuais de fulfillment.
6. `webhooks` para saúde da ingestão Stripe.
7. `communication` para saúde de envios transacionais.

### Diretrizes

1. O dashboard deve usar agregações server-side sobre o conjunto completo de pedidos do período, nunca uma amostra arbitrária.
2. Métricas financeiras devem respeitar moeda; se houver múltiplas moedas no período, a UI deve quebrar totais por moeda ou explicitar a segmentação.
3. Métricas de pedidos devem separar claramente status de pagamento e status de fulfillment.
4. O painel deve priorizar decisão operacional:
   - o que precisa de ação agora;
   - o que está gerando receita;
   - o que está travando a operação;
   - o que está corroendo margem.
5. Cada bloco do dashboard deve apontar para drilldown natural já existente no admin, como `/admin/orders`, `/admin/webhooks` e `/admin/emails`.

### Métricas propostas

#### 1. Resumo executivo

1. `Orders in period`
2. `Paid revenue`
3. `Average order value`
4. `Discount given`
5. `Refunded amount`
6. `Customers purchasing`

#### 2. Saúde do funil de pagamento

1. `Awaiting payment action`
2. `Processing / under review`
3. `Paid / confirmed`
4. `Failed / canceled`
5. `Refunded`
6. `Disputed`

Notas:

- O agrupamento deve reutilizar a taxonomia já refletida em `src/lib/order-status-notification.ts`.
- Esse bloco é mais útil do que o donut atual de `Paid vs Failed`, porque expõe estados realmente operacionais do checkout Stripe.

#### 3. Fila de fulfillment

1. `Received`
2. `Producing`
3. `Shipped`
4. `Paid but not yet in fulfillment`
5. `Orders missing tracking after shipment`, quando aplicável

#### 4. Insight financeiro da loja

1. Receita paga por dia no período.
2. Ticket médio por dia ou por semana.
3. Desconto total aplicado no período.
4. Percentual de pedidos com cupom.
5. Receita líquida aproximada:
   - `paid revenue - refunded amount`
6. Top SKUs ou produtos por volume e receita, em segunda etapa.

#### 5. Operação e risco

1. `Webhook failures in period`
2. `Webhook pending`
3. `Transactional email failures`
4. `Orders touched manually recently`
5. `Recent disputes / refunds`

### Estrutura visual proposta

1. Linha 1: KPIs executivos em cards compactos.
2. Linha 2: dois blocos lado a lado:
   - `Payment funnel`
   - `Fulfillment queue`
3. Linha 3: tendência financeira:
   - série temporal de receita paga;
   - série de descontos;
   - comparativo com período anterior.
4. Linha 4: saúde operacional:
   - webhooks;
   - emails;
   - pedidos com atenção.
5. Linha 5: tabela de pedidos recentes com filtros e atalhos já existentes.

### Componentização sugerida

1. Criar um helper server-only, por exemplo `src/lib/admin-dashboard.ts`, responsável por normalizar período, montar pipelines de agregação e devolver um objeto estável de métricas.
2. Extrair grupos de apresentação em componentes como:
   - `admin-dashboard-kpis.tsx`
   - `admin-dashboard-payment-funnel.tsx`
   - `admin-dashboard-fulfillment.tsx`
   - `admin-dashboard-ops-health.tsx`
3. Reaproveitar os charts já existentes onde fizer sentido, sem forçar os dados novos ao modelo antigo do donut atual.

### Estratégia de agregação

1. Base principal:
   - `users`
   - `$match` com `purchases` não vazio
   - `$unwind: "$purchases"`
   - filtros por período e status quando necessário
2. Agregações secundárias:
   - `orderAuditLogs` para atividade manual recente
   - `webhooks` para backlog e falhas
   - `communication` para falhas transacionais
3. Comparativo de período:
   - calcular o intervalo atual
   - calcular o intervalo imediatamente anterior de mesma duração
   - devolver variação percentual apenas para KPIs seguros

### Regras importantes de consistência

1. Não somar valores de moedas diferentes no mesmo KPI sem segmentação explícita.
2. Não inferir sucesso financeiro a partir do browser return; usar apenas o status persistido no pedido.
3. Não esconder estados de disputa, reembolso ou análise sob o rótulo genérico de `failed`.
4. Manter links de drilldown para investigação operacional rápida.

### Escopo recomendado para implementação

#### Fase 1

1. Corrigir a base de dados do dashboard para agregar todos os pedidos do período.
2. Substituir `Paid vs Failed` por um funil de pagamento com mais estados.
3. Adicionar fila de fulfillment.
4. Adicionar KPIs financeiros: receita paga, ticket médio, desconto e reembolso.
5. Adicionar cards simples de saúde operacional para webhooks e emails.

#### Fase 2

1. Comparativo contra período anterior.
2. Tabela de atenção com pedidos disputados, em processamento prolongado ou pagos sem fulfillment.
3. Top produtos e variantes por receita/volume.
4. Estimativa de SLA até envio usando `orderAuditLogs`.

### Critério de aceite

1. O dashboard deixa de depender de amostragem e passa a refletir o conjunto completo de pedidos do período.
2. Um operador consegue identificar, em uma única tela:
   - quanto vendeu;
   - quanto descontou;
   - quanto refundou;
   - quantos pedidos estão travados no pagamento;
   - quantos estão em cada etapa de fulfillment;
   - se webhooks ou emails estão falhando.
3. Cada métrica principal tem definição consistente com os dados já persistidos no sistema e possui caminho claro de drilldown no admin.

## Planejamento: UX do admin de produtos

### Objetivo

Tornar a criação e a edição de produtos no backoffice mais diretas para operação diária, reduzindo termos técnicos expostos, melhorando a leitura do formulário e deixando o gerenciamento de variantes mais intuitivo.

### Diretrizes

1. O formulário principal deve ser dividido em seções curtas e nomeadas, evitando blocos longos de campos sem hierarquia clara.
2. O estado de disponibilidade deve usar linguagem de negócio, como `Active`, `Inactive` e `Deactivate`, sem mencionar Stripe na UI.
3. Variantes devem permanecer visíveis na página como resumo escaneável, com criação e edição em modal focado para preservar contexto.
4. O modal de variante deve deixar explícito o que é herdado do grupo e o que é configurável localmente, sobretudo preço, estoque, ordem e disponibilidade.

### Escopo implementado

- Criação de produto reorganizada em seções de detalhes do produto, primeira variante, preço e disponibilidade.
- Edição do grupo reorganizada em bloco de detalhes compartilhados mais controle explícito de disponibilidade.
- Área de variantes convertida de abas para lista resumida com cards escaneáveis.
- Criação e edição de variante concentradas em modais focados.
- Rótulo técnico `Active in Stripe` removido do admin de produtos.

## Planejamento: Auditoria em order details

### Objetivo

Garantir que alterações manuais feitas por operadores internos em pedidos, especialmente no bloco de fulfillment, fiquem registradas de forma auditável e visível na própria tela administrativa do pedido.

### Diretrizes

1. Toda atualização manual de fulfillment no admin deve registrar ator, papel, data e valores antes/depois.
2. O histórico de auditoria do pedido deve ser mostrado dentro de `Order details`, sem exigir consulta externa.
3. O log de auditoria deve complementar, e não substituir, o histórico funcional já persistido no próprio pedido.

### Escopo implementado

- Registro explícito de auditoria para mudanças de fulfillment e tracking number em pedidos no admin.
- Exibição do histórico de edição do pedido em um card dedicado abaixo dos dados operacionais.
- Refresh imediato da tela após salvar fulfillment, refletindo o novo registro de auditoria sem recarga manual.
- Visualização amigável do histórico com pares `Before` e `After` por campo auditado.

## Planejamento: Sistema de cálculo de fretes por provedor

### Objetivo

Implementar um motor de cálculo de fretes extensível, permitindo que a administração escolha o provedor ativo por configuração, enquanto o checkout e o carrinho consomem uma API interna única e estável.

### Diagnóstico do estado atual

1. O projeto já possui endereço, país, CEP e cálculo de preço com suporte a rota de lookup postal, mas ainda não tem um motor formal de cotação de frete.
2. O modelo de carrinho já carrega `shippingRate`, o que permite incorporar custo de entrega ao resumo sem quebrar a estrutura atual.
3. A experiência de checkout precisa continuar previsível mesmo quando um provedor externo estiver indisponível ou sem credenciais válidas.
4. O admin ainda não oferece uma camada única para escolher, ativar ou desativar fornecedores de frete.

### Princípio de arquitetura

1. A aplicação deve expor uma interface interna única para cotação de frete.
2. Cada transportadora ou agregador deve ser implementado como adaptador isolado.
3. O checkout nunca deve conhecer a API do provedor diretamente; ele deve depender apenas do contrato interno do sistema.
4. A camada administrativa deve controlar seleção, credenciais, priorização e fallback sem alterar a UI do checkout.

### Contrato interno sugerido

1. `quoteShipping(options)`:
   - calcula valor e prazo por CEP, país, peso, dimensões e itens do carrinho;
   - retorna opções normalizadas com `provider`, `serviceCode`, `serviceName`, `price`, `currency`, `estimatedDays` e `isAvailable`.
2. `listShippingServices()`:
   - lista os serviços habilitados para o admin e para a storefront.
3. `createShipment()`:
   - opcional, reservado para emissão de envio ou etiqueta quando o provedor suportar essa etapa.
4. `trackShipment()`:
   - opcional, para rastreamento quando a integração expuser esse recurso.

### Modelo de dados sugerido

1. `shippingProviders`
   - `id`
   - `code`
   - `name`
   - `enabled`
   - `priority`
   - `credentialsRef`
   - `supportedCountries`
   - `services`
   - `lastHealthCheckAt`
   - `lastHealthStatus`
2. `shippingQuotes`
   - `cartId` ou `orderDraftId`
   - `provider`
   - `serviceCode`
   - `serviceName`
   - `price`
   - `currency`
   - `estimatedDays`
   - `expiresAt`
   - `status`
3. `shippingRules`
   - faixas de peso
   - restrições por CEP ou país
   - frete grátis por subtotal
   - markup ou desconto por serviço
4. `orderDrafts`
   - snapshot da cotação escolhida para manter o valor congelado no momento do checkout

### Fluxo funcional proposto

1. A pessoa usuária informa ou confirma o endereço.
2. O servidor normaliza país, CEP, peso e dimensões aplicáveis.
3. O motor de frete consulta o provedor ativo.
4. O sistema normaliza a resposta em um formato único.
5. O checkout exibe as opções disponíveis, ordenadas por prioridade ou menor prazo.
6. A escolha é congelada no carrinho e no `orderDraft`.
7. No pagamento, o pedido carrega a cotação selecionada como parte do snapshot operacional.

### Regras de fallback

1. Se o provedor principal falhar, o sistema pode tentar o próximo provedor habilitado.
2. Se nenhum provedor responder, a UI deve degradar de forma segura e informar que as opções de frete estão temporariamente indisponíveis.
3. O carrinho e a storefront não devem quebrar quando o cálculo externo falhar.
4. Se a cotação expirar, o checkout deve recalcular antes de confirmar o pagamento.
5. Para pedidos já fechados, a cotação usada precisa permanecer auditável, mesmo que o preço atual do provedor mude depois.

### Administração proposta

1. Tela de provedores com status `active`, `inactive` e saúde da integração.
2. Configuração de credenciais por provedor com armazenamento seguro no servidor.
3. Seleção do provedor padrão e da ordem de fallback.
4. Regras comerciais:
   - frete grátis acima de um subtotal;
   - preço fixo por região;
   - exclusão por país;
   - markup por serviço;
   - restrição por peso ou dimensões.
5. Histórico de falhas e última resposta válida por provedor.

### UI e experiência

1. No carrinho e no checkout, as opções de frete devem aparecer como cards ou radios claros, com preço, prazo e nome do serviço.
2. A pessoa usuária deve entender rapidamente quando o frete está indisponível e quando a seleção foi aplicada com sucesso.
3. Em mobile, a área de frete precisa continuar legível sem empurrar o resumo do pedido para fora da tela.
4. O admin precisa conseguir trocar de provedor sem reconfigurar a interface pública.

### Fases de implementação

#### Fase 1

1. Criar o contrato interno de cotação.
2. Implementar o primeiro adaptador de provedor.
3. Expor a configuração do provedor ativo no admin.
4. Integrar a cotação ao carrinho e ao checkout.
5. Congelar a cotação escolhida no `orderDraft`.

#### Fase 2

1. Adicionar fallback entre múltiplos provedores.
2. Implementar rastreio e, quando disponível, criação de envio.
3. Adicionar health check e histórico operacional no admin.
4. Permitir regras comerciais mais avançadas por região e por faixa de peso.

### Critério de aceite

1. O checkout consegue mostrar frete calculado por pelo menos um provedor externo via API interna única.
2. O admin consegue ativar, desativar e priorizar provedores sem alterar o front.
3. A cotação escolhida fica registrada no fluxo do pedido e não muda retroativamente.
4. Falhas de provedor degradam com segurança, sem quebrar carrinho, checkout ou resumo do pedido.

### Status de implementação

1. O painel administrativo de settings agora permite cadastrar provedores de frete com prioridade, modo `flat` ou `http`, credenciais e países suportados.
2. O resolvedor server-side de frete já busca o provedor ativo por prioridade e normaliza a resposta em uma cotação interna única.
3. O carrinho, o checkout e o snapshot do pedido agora carregam `shippingRate` e `shippingError` derivados do servidor.
4. A Stripe passa a receber o total final já somado com o frete, enquanto o preço-base do catálogo permanece separado.
5. O admin de frete agora expõe presets tipados para `Correios`, `Jadlog`, `EasyPost` e `Custom HTTP`, com credenciais mascaradas por campo, endpoints específicos por API e defaults de pacote para fallback de cotação.
6. O runtime de frete agora escolhe adapters dedicados para `Correios`, `Jadlog`, `EasyPost` ou `Custom HTTP`, preservando um contrato interno único para carrinho e checkout.
7. O painel administrativo agora também expõe uma chave global para ativar ou desativar o cálculo de frete inteiro, interrompendo cotações manuais e via API antes que alcancem carrinho ou checkout.

## Planejamento: Escolha de entrega no checkout

### Objetivo

Permitir que a pessoa usuária escolha, no checkout, entre usar o endereço salvo, informar um novo endereço de entrega ou retirar na loja, sempre com exibição clara de prazo e valor estimado antes do pagamento.

### Diretriz de UX

1. A pergunta sobre entrega precisa aparecer antes da etapa de pagamento.
2. A escolha deve ficar em um bloco único e fácil de escanear.
3. O resumo da entrega deve ser visível já na primeira dobra do checkout.
4. O novo endereço deve reaproveitar os componentes de endereço já existentes no produto.
5. A retirada na loja precisa ser tratada como caminho de entrega real, com prazo próprio e valor estimado explícito.

### Diretriz de UI

1. Exibir três cards ou radios principais:
   - usar endereço cadastrado;
   - informar novo endereço;
   - retirar na loja.
2. Cada opção deve mostrar:
   - rótulo principal;
   - prazo estimado;
   - custo estimado;
   - observação curta de contexto.
3. O endereço selecionado deve aparecer em bloco de confirmação antes do `PaymentElement`.
4. O bloco do novo endereço deve usar os mesmos campos e comportamento de bloqueio de CEP já usados em cadastro e perfil.
5. A retirada deve ter tratamento visual equivalente às demais opções, sem parecer uma ação secundária escondida.

### Regras funcionais

1. O checkout deve partir do endereço salvo quando ele existir e a pessoa não pedir edição.
2. Ao informar novo endereço, a cotação de frete precisa ser recalculada no servidor antes de confirmar o pagamento.
3. Ao escolher retirada, o frete de entrega deve ser substituído por uma opção de retirada com prazo e valor estimado próprios.
4. O valor final enviado à Stripe deve sempre refletir a entrega selecionada.
5. A escolha de entrega precisa ser congelada no `orderDraft` junto do snapshot do pedido.

### Status da implementação

1. O fluxo de seleção de entrega agora está incorporado ao checkout, com escolha entre endereço salvo, novo endereço e retirada na loja.
2. A ação de checkout já aceita a escolha de entrega e recotação server-side antes da confirmação do pagamento.
3. A UI do checkout já exibe o bloco de entrega antes do pagamento, com prazo e valor estimado, e o snapshot do pedido congela a seleção escolhida.

## Planejamento: Identidade interna de pedidos

### Objetivo

Desacoplar o identificador canônico do pedido dos ids técnicos da Stripe, adotando um `orderId` interno para uso em admin, suporte, emails e superfícies do produto.

### Diretrizes

1. Pedidos do fluxo com `PaymentIntent` não devem usar `pi_...` como `purchases.id` canônico.
2. O id principal do pedido deve ser gerado internamente pela aplicação, enquanto ids Stripe permanecem apenas em campos técnicos de reconciliação.
3. Rotas e consultas devem continuar aceitando ids Stripe legados como fallback para compatibilidade.

### Escopo implementado

- Novos pedidos do fluxo `PaymentIntent` agora recebem `orderId` interno persistido desde o `orderDraft`.
- Reconciliação por browser sync, webhook, admin e leitura de pedido continuam aceitando `paymentIntentId` e `sessionId` como identificadores relacionados.
- O admin de pedidos passou a privilegiar o `orderId` interno como identificador principal.

## Planejamento: Storefront multilíngue

### Objetivo

Habilitar internacionalização técnica para a storefront com `en-US` como fallback, suporte ativo a `pt-BR` e `es-ES`, e detecção automática da localidade do dispositivo do usuário, sem alterar URLs existentes nem impactar fluxos funcionais já consolidados.

### Diretrizes

1. O locale resolvido por requisição deve seguir esta ordem:
   - override explícito futuro;
   - idioma suportado informado pelo navegador/dispositivo;
   - idioma padrão configurado pelo admin;
   - `NEXT_PUBLIC_LANGUAGE` como fallback final.
2. A escolha de idioma não deve exigir prefixos de rota nem quebrar deep links, sitemap, checkout, login ou páginas administrativas existentes.
   - Como atalho de QA e suporte, a storefront pode aceitar uma URL de entrada com prefixo de locale, como `/en`, `/en-us`, `/pt-br` ou `/es`, desde que isso apenas persista o cookie de locale e redirecione imediatamente para a URL canônica sem prefixo.
3. O admin deve controlar ao menos o idioma padrão da storefront e o país padrão dos formulários compartilhados.
4. Campos de telefone, país, datas e moeda devem respeitar o locale resolvido sempre que a superfície for voltada ao cliente.
5. Faltas pontuais de tradução devem degradar com segurança para `en-US`, nunca quebrar renderização.

### Escopo implementado

- Resolver locale por requisição em `src/i18n`, com fallback por `Accept-Language`, configuração administrativa e fallback final em ambiente.
- Aceitar prefixos opcionais de locale na entrada para fins de override manual, persistindo `ratoeira_locale` e redirecionando de volta para a rota canônica sem prefixo.
- Expor `defaultLocale` no documento `settings` e no painel administrativo de regionais.
- Adicionar catálogo de mensagens para `es-ES` e ampliar `en-US` / `pt-BR`.
- Internacionalizar as superfícies públicas e de conta com maior impacto:
  - navegação e rodapé;
  - login, cadastro e conclusão de OAuth;
  - perfil, favoritos, compras e métodos de pagamento;
  - carrinho, checkout e processamento do pedido;
  - páginas institucionais principais.
- Usar o locale resolvido em formatação de moeda e datas nas superfícies do cliente.

### Fora de escopo desta etapa

- Persistência de preferência manual de idioma por usuário autenticado.
- Estrutura canônica de rotas segmentada por locale.
- Tradução completa de superfícies administrativas e emails transacionais.

## Planejamento: Preferência de moeda por usuário

### Objetivo

Permitir que o cliente escolha sua moeda preferida no cadastro e no perfil, refletindo essa preferência na storefront, no carrinho e no checkout Stripe sem introduzir conversões artificiais nem divergência entre o valor exibido e o valor cobrado.

### Diretrizes

1. A moeda preferida deve ser persistida no documento do usuário e poder ser inicializada no cadastro.
2. Para usuários não autenticados, o sistema pode usar cookie de preferência ou fallback derivado do locale resolvido.
3. A storefront só pode trocar o valor nominal exibido e cobrado quando o `Price` correspondente da Stripe suportar a moeda desejada em `currency_options`.
4. Se uma variante, cupom ou conjunto de itens do carrinho não suportar a moeda preferida, o sistema deve degradar com segurança para a moeda padrão do catálogo, nunca exibir uma moeda e cobrar outra.
5. Metadados úteis de auditoria e reconciliação na Stripe, como `Customer.metadata.preferredCurrency`, devem permanecer alinhados à preferência persistida.

### Escopo implementado

- Persistir `preferredCurrency` em cadastro, perfil e documento `users`.
- Resolver moeda preferida por requisição com fallback por usuário autenticado, cookie de convidado e locale.
- Ler `currency_options` da Stripe para catálogo, carrinho, favoritos e checkout transparente.
- Fazer o checkout transparente usar a moeda efetiva do snapshot, com fallback automático para a moeda padrão quando a moeda desejada não estiver disponível em todos os itens.

### Fora de escopo desta etapa

- Conversão dinâmica por câmbio externo fora da Stripe.
- Painel administrativo para editar preços multi-moeda em massa.
- Garantia de multi-moeda para catálogos Stripe que ainda não tenham `currency_options` configuradas.

## Planejamento: Checkout Transparente Stripe

### Objetivo

Implementar checkout transparente com a interface do próprio site, usando Stripe PaymentIntent e Stripe Elements/Payment Element, sem capturar ou armazenar dados sensíveis de cartão no servidor da aplicação. O fluxo deve preservar o desenho visual atual sempre que possível, melhorar a confiança do usuário e manter webhooks assinados como fonte de verdade para confirmação final do pedido.

### Estado Atual

- `src/app/checkout/page.tsx` cria uma Stripe Checkout Session e redireciona o usuário para uma página hospedada pela Stripe.
- `src/actions/checkout-actions.ts` monta itens do carrinho a partir do usuário autenticado, cria ou reutiliza um `stripeCustomerId` e cria `checkout.sessions.create`.
- `src/app/api/stripe/webhook/route.ts` já valida assinatura quando `STRIPE_WEBHOOK_SECRET` existe e processa eventos de `checkout.session`, `payment_intent`, `charge`, `refund`, `invoice` e `subscription`.
- `@stripe/react-stripe-js` e `@stripe/stripe-js` já estão instalados, então a base para Elements existe no projeto.

### Arquitetura Proposta

1. Criar uma camada servidor para `PaymentIntent`.
2. Substituir o redirecionamento em `/checkout` por uma tela interna de checkout.
3. Renderizar `PaymentElement` em um componente cliente isolado.
4. Confirmar pagamento com `stripe.confirmPayment` no cliente.
5. Redirecionar para `/checkout/processing` após confirmação ou autenticação 3DS.
6. Finalizar pedido somente após webhook confiável ou verificação servidor-servidor do `PaymentIntent`.

### Etapas de Implementação

1. Extrair a resolução segura do carrinho.
Criar um helper server-only, por exemplo `src/lib/checkout/cart-snapshot.ts`, responsável por autenticar o usuário, mesclar carrinho convidado quando necessário, resolver variantes via Stripe, recalcular preços no servidor e produzir um snapshot imutável com `priceId`, produto, variante, quantidade, subtotal, moeda e hash do carrinho.

2. Criar ou atualizar `PaymentIntent`.
Adicionar uma action ou rota servidor, por exemplo `createOrUpdatePaymentIntent`, que receba apenas intenção de iniciar checkout, nunca valores vindos do cliente. Ela deve calcular `amount`, `currency`, `customer`, `metadata.userId`, `metadata.cartHash` e `metadata.orderDraftId`, usar chave de idempotência baseada no usuário e no carrinho, e reutilizar um intent ainda não finalizado quando o carrinho não mudou.

3. Persistir rascunho de pedido.
Criar coleção ou subdocumento de `orderDrafts` com status inicial `requires_payment_method`, itens congelados, valor total, moeda, `paymentIntentId`, `cartHash`, `userId`, timestamps e histórico mínimo. Isso reduz dependência de consultas tardias ao carrinho, que pode mudar depois da confirmação.

4. Implementar UI interna do checkout.
Transformar `src/app/checkout/page.tsx` em Server Component que carrega o snapshot e passa `clientSecret`, resumo do pedido e publishable key para um componente cliente. Criar algo como `src/app/checkout/checkout-form.client.tsx` com `Elements`, `PaymentElement`, botão de pagamento, mensagens de erro, estado de processamento e bloqueio contra duplo clique.

5. Confirmar pagamento no cliente.
Usar `stripe.confirmPayment({ elements, confirmParams: { return_url } })`. O `return_url` deve apontar para uma rota própria, por exemplo `/checkout/return?payment_intent={PAYMENT_INTENT_ID}`, ou diretamente para `/checkout/processing`, conforme o comportamento escolhido para métodos com redirecionamento.

6. Reescrever retorno e processamento.
Adaptar `src/app/checkout/return/route.ts` para consultar `payment_intent` em vez de `checkout.session`. A página de processamento deve aceitar `payment_intent` e mostrar estados `succeeded`, `processing`, `requires_payment_method`, `canceled` e `failed`, sem limpar carrinho antes de uma confirmação confiável.

7. Fortalecer webhook.
Priorizar eventos `payment_intent.succeeded`, `payment_intent.processing`, `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded` e `charge.dispute.created`. O webhook deve usar `metadata.userId`, `metadata.orderDraftId` e `metadata.cartHash` para atualizar o pedido idempotentemente, evitar duplicidade por `event.id` e só limpar carrinho quando o pagamento estiver `succeeded` ou em estado assíncrono aceito.

8. Remover dependência do Checkout Session no fluxo principal.
Manter `createCheckoutSession` apenas como fallback temporário ou remover após migração. Enquanto houver coexistência, separar claramente rotas e eventos para evitar que pedidos criados por `PaymentIntent` e `Checkout Session` disputem o mesmo modelo.

### Segurança

- Nunca enviar `amount`, `currency`, `priceId` ou quantidade confiável do cliente para criar cobrança; o cliente só pode solicitar início ou confirmação.
- Nunca registrar `client_secret` em logs, URLs públicas persistentes, analytics ou documentos de pedido.
- Usar HTTPS em produção para qualquer página com Elements.
- Manter `STRIPE_SECRET_KEY` apenas em server actions, route handlers e libs server-only.
- Validar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` somente no cliente e tratar ausência com erro de configuração amigável.
- Usar assinatura de webhook em produção; sem `STRIPE_WEBHOOK_SECRET`, permitir parsing inseguro apenas em desenvolvimento local.
- Tornar operações de pedido idempotentes por `paymentIntentId`, `event.id` e `orderDraftId`.
- Não limpar carrinho nem marcar pedido como pago baseado apenas em retorno do navegador.
- Aplicar rate limiting ou trava lógica para criação de intents por usuário/carrinho, caso o volume de tentativas cresça.
- Evitar campos manuais de cartão; todo dado de pagamento deve passar por Stripe Elements.

### Confiabilidade

- Reutilizar ou atualizar PaymentIntent quando o usuário recarregar a página e o carrinho não tiver mudado.
- Cancelar ou abandonar intents antigos quando o carrinho mudar de forma incompatível.
- Armazenar snapshot do pedido antes de confirmar para que webhooks atrasados ainda possam montar o pedido corretamente.
- Tratar métodos assíncronos com estado `processing` sem prometer confirmação imediata.
- Criar uma rotina de reconciliação administrativa para intents pagos que não viraram pedido por falha temporária de webhook.
- Manter mensagens de erro recuperáveis: pagamento recusado volta para o formulário; erro técnico orienta tentar novamente sem duplicar cobrança.

### Modelo de Dados Sugerido

Campos mínimos de `orderDrafts`:

- `userId`
- `paymentIntentId`
- `stripeCustomerId`
- `cartHash`
- `status`
- `amountTotal`
- `currency`
- `items`
- `createdAt`
- `updatedAt`
- `confirmedAt`
- `lastStripeEventId`

Campos mínimos em purchase final:

- `id`, preferencialmente `paymentIntentId` ou `orderDraftId`
- `kind: "payment_intent"`
- `status`
- `amountTotal`
- `currency`
- `items`
- `relatedIds.paymentIntentId`
- `relatedIds.chargeIds`
- `events`

### Testes e Validação

- Unit tests para cálculo de snapshot, hash do carrinho, idempotência e bloqueio de carrinho vazio.
- Testes de route/action para criar, reutilizar e atualizar PaymentIntent sem aceitar valores do cliente.
- Testes do componente de checkout com mocks de `@stripe/react-stripe-js`.
- Testes de webhook para sucesso, falha, evento duplicado, evento sem metadata e evento de outro usuário.
- Validação manual com cartões de teste Stripe para sucesso, recusa, 3DS, processamento assíncrono e recarregamento da página.

### Critérios de Aceite

- O usuário paga sem sair da interface visual do site, exceto quando um método de pagamento exigir autenticação externa.
- O valor cobrado é sempre calculado no servidor a partir do carrinho e dos preços Stripe atuais.
- Recarregar a página de checkout não cria cobranças duplicadas.
- Webhook assinado finaliza pedido e registra histórico idempotente.
- Carrinho só é limpo após confirmação confiável.
- Falhas de pagamento não criam pedido pago nem removem itens do carrinho.
- O fluxo passa em `yarn lint`, `yarn test` e `tsgo`.

### Status de Implementação

- Implementado em `/checkout` com `PaymentIntent`, `PaymentElement` e confirmação via `stripe.confirmPayment`.
- Implementado snapshot servidor em `src/lib/checkout/cart-snapshot.ts` para recalcular itens, quantidades, preços, moeda e hash do carrinho.
- Implementada persistência de rascunhos em `orderDrafts`, com `paymentIntentId`, `cartHash`, itens congelados e status.
- Implementada reconciliação por navegador em `recordPaymentIntentCheckout`, sem limpar carrinho para pagamentos recusados.
- Webhook atualizado para popular pedidos de `payment_intent` usando o rascunho congelado e limpar o carrinho quando o pagamento for `succeeded`.
- Handler legado de sucesso do Checkout Session isolado do fluxo com `payment_intent`, evitando interromper `/checkout/processing` ou exibir `unknown status` após confirmação imediata.
- Webhook ajustado para derivar status prioritariamente pelo significado do `event.type`, preservando estados coerentes para `checkout.session`, `payment_intent`, `charge` e `refund`.
- O fluxo legado de Checkout Session foi mantido como compatibilidade temporária nas actions e APIs existentes.
- Implementado salvamento opcional de método de pagamento com consentimento explícito no checkout, usando `setup_future_usage: "on_session"` no `PaymentIntent`.
- Implementadas APIs autenticadas para listar e remover métodos de pagamento salvos no Stripe, expondo somente metadados seguros como bandeira, final, mês e ano de expiração.
- Implementada seção `Payment methods` no menu da conta do usuário para listar e remover métodos salvos sem expor dados completos de cartão.
- Implementada seleção explícita de método de pagamento salvo dentro do checkout, com fallback para novo método via `PaymentElement` e confirmação do `PaymentIntent` usando o `payment_method` salvo escolhido.
- Implementado registro persistente de todas as tentativas de webhook Stripe, incluindo falhas de assinatura e payload inválido, com tela administrativa dedicada para inspeção dos recebidos.
- Corrigida a estratégia de reconciliação de compras por webhook para localizar a compra no código antes do update, evitando falhas do Mongo com operador posicional em eventos como `payment_intent.succeeded`.
- Emails transacionais de pedidos devem sair apenas em mudanças semânticas percebidas pelo cliente, consolidando transições equivalentes como `paid` e `succeeded`, com cópia orientada ao cliente e metadados do último envio registrados no próprio pedido.
- O retorno do checkout deve disparar o email de `pedido recebido` assim que o pedido for registrado, mas a confirmação de pagamento e a limpeza final do carrinho devem continuar aguardando exclusivamente o webhook da Stripe.
- A tela `/checkout/processing` deve fazer polling do browser sync apenas por uma janela curta e limitada; se não houver confirmação final nesse prazo, o spinner deve ceder lugar a um aviso de processamento pendente com orientação para acompanhar o pedido por e-mail e na área de pedidos. Estados autoritativos de disputa/análise não devem manter loading.
- Implementado histórico administrativo de emails em `/admin/emails`, consultando a coleção `communication` com filtros por status, tipo e busca textual, além de registrar assunto, template, origem e referências de usuário/pedido nos novos envios persistidos.
- A tabela administrativa de emails agora abre um popup ao selecionar um registro, renderizando o HTML do email em `iframe` com painel lateral de metadados para inspeção rápida do envio.
- O envio de emails agora tenta `SMTP` como rota primária e, se falhar, pode cair automaticamente para um provedor externo opcional por API, mantendo os chamadores desacoplados do fornecedor e persistindo no histórico qual transporte efetivamente enviou.
- O admin de emails agora expõe ação de reenvio por registro, via rota protegida, usando o assunto e conteúdo persistidos no log para gerar uma nova tentativa sem alterar o documento original.
- A tabela do admin de emails foi reduzida aos campos essenciais, enquanto o popup concentra erro de envio, tentativas, contexto e demais metadados necessários para diagnóstico.
- O fallback via Brevo agora omite `cc`, `bcc` e `replyTo` quando não houver destinatários nesses campos, evitando respostas `400 missing_parameter` da API para payloads com arrays vazios.
- A ordem padrão de entrega foi invertida para `API -> SMTP`, coberta por teste unitário, e o admin de emails agora expõe retentativas explícitas por `API` e por `SMTP`, além de mostrar no popup qual via concluiu o envio.

## Planejamento: Cadastro avançado e autenticação social

### Objetivo

Evoluir a experiência de cadastro para um fluxo mais completo, confiável e reutilizável, com:

- preenchimento inteligente de endereço por CEP ou código postal;
- campo de telefone com bandeira, DDI e validação por país;
- validações mais claras e assíncronas;
- base pronta para login social por OAuth 2.0 ou OpenID Connect;
- preservação da arquitetura atual de sessão própria com MongoDB.

### Estado atual

- `src/ui/login-form.tsx` concentra login, cadastro e recuperação em um único componente cliente.
- O cadastro atual já coleta `name`, `email`, `phone`, `address.*`, `password` e confirmação de senha.
- `src/app/api/auth/register/route.ts` cria usuários locais no Mongo, envia email de verificação e faz merge de carrinho convidado.
- A sessão autenticada usa cookie próprio persistido em `sessions`, por `src/lib/session.ts`, e não depende de Auth.js hoje.
- O perfil do usuário em `src/ui/profile-editor.client.tsx` repete campos semelhantes ao cadastro, sem componentes compartilhados para telefone/endereço.

### Diretriz arquitetural

A implementação deve ser incremental. Em vez de substituir todo o sistema atual de autenticação, o caminho preferencial é:

1. extrair primitivas compartilhadas de cadastro e perfil;
2. adicionar suporte a identidades sociais vinculadas ao usuário;
3. centralizar o controle operacional dos provedores OAuth no admin;
4. continuar emitindo a sessão atual com `createPersistentSession`;
5. só considerar migração completa de stack de autenticação se os requisitos futuros ultrapassarem claramente o modelo atual.

Isso reduz risco em áreas já sensíveis do projeto, como merge de carrinho, verificação de email, roles administrativas e sessões revogáveis em Mongo.

### Escopo funcional proposto

1. O login por email e senha deve usar um POST clássico de formulário com redirect/cookie no servidor para preservar o reconhecimento de salvamento de senha do Chrome, mesmo que existam fallbacks de Credential Management API.
1.1. O campo identificador desse login deve usar `name="username"` e o submit deve apontar para uma rota de página, por exemplo `/login/submit`, evitando um alvo `/api/...` para maximizar a heurística de salvamento do Chrome.
1.2. O cluster de OAuth no login deve seguir `AUTH_SOCIAL_BUTTON_PATTERN.md`, com trilho centralizado de coluna única, largura máxima compartilhada com a ação principal, tipografia consistente e tratamento especial do botão do Google para respeitar suas regras oficiais de branding.
1. Separar login e cadastro em blocos mais modulares dentro da tela atual.
2. Criar componentes reutilizáveis para telefone internacional e endereço.
3. Implementar busca de CEP ou código postal com preenchimento automático parcial.
4. Adicionar validação assíncrona de email disponível, CEP válido e telefone plausível.
5. Persistir origem e vínculos de autenticação do usuário.
6. Adicionar configuração administrativa por provedor, com toggle de ativação e credenciais.
7. Adicionar login social com provedores priorizados.
8. Permitir link e unlink de provedores sociais na área do usuário em fase posterior.

### Requisito novo: controle no admin

Os provedores OAuth não devem ficar apenas hardcoded por `.env`. O admin precisa conseguir:

- habilitar ou desabilitar cada provedor individualmente;
- manter `start`, `callback` e `complete` de OAuth como rotas públicas no proxy global, para que o handshake não receba `401 Unauthorized` antes de chegar ao handler;
- persistir `clientId` e `clientSecret` criptografados em repouso no Mongo com derivação a partir de `JWT_SECRET`, preservando compatibilidade de descriptografia com formatos legados quando necessário;
- cadastrar ou atualizar `client id`, `client secret` e demais campos obrigatórios;
- visualizar o status de configuração de cada provedor sem expor o segredo completo;
- impedir que um botão social apareça no login quando o provedor estiver desabilitado ou incompleto.

Os valores sensíveis podem continuar aceitando fallback via `.env`, mas a fonte primária do produto deve ser a configuração persistida no painel administrativo.

### Fase 1: refatoração do formulário de cadastro

Criar uma camada de formulário compartilhada, por exemplo:

- `src/ui/auth/register-form.client.tsx`
- `src/ui/auth/phone-input.client.tsx`
- `src/ui/auth/address-fields.client.tsx`
- `src/lib/validation/register.ts`

Responsabilidades:

- remover a lógica de cadastro de dentro do `login-form` monolítico;
- centralizar schema e mensagens;
- expor `id`, `name` e `autocomplete` estáveis;
- permitir reuso no perfil do usuário e, depois, no checkout.

### Fase 2: telefone internacional com bandeira e DDI

Implementar um campo de telefone baseado em país, com:

- seletor lateral com país e DDI, iniciando pelo país padrão definido no admin;
- formatação progressiva;
- armazenamento canônico em E.164;
- exibição amigável formatada no cliente;
- fallback para digitação manual se a máscara não reconhecer o país.

Abordagem sugerida:

- usar `react-phone-number-input` com `libphonenumber-js`, ou equivalente leve compatível com React 19;
- salvar no Mongo algo como:
  - `phone.e164`
  - `phone.country`
  - `phone.national`
- manter compatibilidade temporária lendo `phone` legado em string durante a migração.

### Fase 3: CEP ou postal code com autocomplete por API

Criar um adaptador server-side de lookup, por exemplo `src/lib/address/postal-lookup.ts`, para evitar acoplamento direto da UI a provedores externos.

Estratégia inicial:

1. Quando `country = BR`, consultar ViaCEP e usar BrasilAPI como fallback secundário.
2. Quando o país não tiver provedor dedicado, permitir preenchimento manual.
3. Se o produto exigir cobertura global depois, evoluir para um provedor pago com autocomplete e validação internacional.

Comportamento esperado:

- usuário informa CEP;
- para CEP brasileiro, a busca deve iniciar automaticamente quando os 8 dígitos forem completados, sem depender apenas de sair do campo;
- o cliente chama uma rota interna, por exemplo `GET /api/address/postal-lookup?country=BR&postalCode=01001000`;
- a rota normaliza, consulta o provedor e devolve campos internos padronizados;
- o formulário preenche `line1` como rua/logradouro, `district` como bairro, `city`, `state` e `country`, mantendo `number` e `complement` como campos manuais;
- quando o CEP brasileiro for resolvido com sucesso, `line1`, `district`, `city` e `state` devem ficar desabilitados para edição manual até o CEP mudar ou a busca ser invalidada; apenas `number` permanece obrigatório para digitação manual e `complement` segue opcional;
- falha da API nunca bloqueia o cadastro; apenas desativa o preenchimento automático.

### Fase 4: validações e UX de formulário

Adicionar validações em dois níveis:

1. Client-side:
   - força de senha;
   - confirmação de senha;
   - formato de email;
   - normalização de CEP e telefone;
   - debounce para disponibilidade de email.
2. Server-side:
   - schema único com Zod;
   - sanitização de endereço e telefone;
   - prevenção de duplicidade por email e identidade social;
   - rate limiting básico nas rotas públicas de autenticação.

Melhorias de UX:

- estados de carregamento por campo;
- mensagens inline por campo;
- persistência de valores digitados quando o submit falhar;
- suporte melhor a autofill do navegador;
- preservação do save de credenciais do Chrome mesmo quando o login usa redirect por Server Action, com armazenamento transitório do draft e `navigator.credentials.store()` após autenticação;
- etapa opcional de aceite de marketing, se isso fizer sentido para o negócio.

### Fase 5: modelo de dados para autenticação social

Estender o documento de usuário com identidades externas, por exemplo:

```ts
identities: [
	{
		provider: "google" | "apple" | "facebook" | "instagram",
		providerAccountId: string,
		email?: string,
		displayName?: string,
		avatarUrl?: string,
		accessTokenEncrypted?: string,
		refreshTokenEncrypted?: string,
		tokenExpiresAt?: Date,
		scope?: string[],
		linkedAt: Date,
		lastLoginAt?: Date,
	}
]
```

E campos auxiliares:

- `authMethods: ("password" | "google" | "apple" | "facebook" | "instagram")[]`
- `lastLoginProvider`
- `profileImage`

Criar também uma configuração administrativa persistida, preferencialmente dentro de `settings.current.oauthProviders`, por exemplo:

```ts
oauthProviders: {
	google?: {
		enabled: boolean;
		clientId?: string;
		clientSecretEncrypted?: string;
		configuredAt?: string;
		updatedBy?: string;
	}
	apple?: {
		enabled: boolean;
		clientId?: string;
		clientSecretEncrypted?: string;
		teamId?: string;
		keyId?: string;
		privateKeyEncrypted?: string;
		configuredAt?: string;
		updatedBy?: string;
	}
	facebook?: {
		enabled: boolean;
		clientId?: string;
		clientSecretEncrypted?: string;
		configuredAt?: string;
		updatedBy?: string;
	}
	instagram?: {
		enabled: boolean;
		clientId?: string;
		clientSecretEncrypted?: string;
		configuredAt?: string;
		updatedBy?: string;
	}
}
```

Índices sugeridos:

- `users.email`
- `users.identities.provider + users.identities.providerAccountId` com unicidade

### Fase 6: OAuth social sem trocar a sessão atual

Implementar rotas próprias por provedor, por exemplo:

- `src/app/api/auth/oauth/google/start/route.ts`
- `src/app/api/auth/oauth/google/callback/route.ts`
- `src/app/api/auth/oauth/facebook/start/route.ts`
- `src/app/api/auth/oauth/facebook/callback/route.ts`

Fluxo:

1. usuário clica no provedor;
2. a aplicação gera `state`, `nonce` e PKCE quando aplicável;
3. redireciona ao provedor;
4. callback troca código por token no servidor;
5. backend busca identidade mínima do usuário;
6. sistema encontra usuário existente por identidade vinculada;
7. se não houver vínculo, tenta reconciliar por email confiável;
8. cria ou vincula conta;
9. emite a sessão atual com `createPersistentSession`;
10. executa o mesmo merge de carrinho já usado no login ou no cadastro.

Antes de iniciar qualquer redirecionamento OAuth, a rota deve carregar a configuração ativa do provedor no banco:

- se `enabled !== true`, retornar indisponível;
- se faltarem credenciais obrigatórias, retornar indisponível;
- se existir fallback em `.env`, ele só deve ser usado como compatibilidade controlada, nunca para ignorar um provedor explicitamente desabilitado pelo admin.

### Fase 6.1: painel administrativo de OAuth

Expandir `src/app/admin/settings/page.tsx` e `src/app/api/admin/settings/route.ts` para incluir uma seção `OAuth providers`.

Sugestão de entregas:

1. Card por provedor com status `enabled`, `disabled`, `incomplete` e `ready`.
2. Campos editáveis para `client id` e credenciais específicas do provedor.
3. Inputs sensíveis do tipo write-only:
   - o admin pode substituir o segredo;
   - a UI mostra apenas algo como `configured` ou sufixo mascarado;
   - o segredo nunca volta puro para o cliente.
4. Botão de ativar só disponível quando a configuração mínima estiver completa.
5. Histórico de alterações no mesmo documento `settings.history`.

### Resolução de configuração

Criar um helper server-only, por exemplo `src/lib/auth/oauth-config.ts`, responsável por:

- ler `settings.current.oauthProviders`;
- descriptografar segredos quando necessário;
- combinar com fallback opcional de `.env`;
- devolver uma configuração normalizada por provedor;
- expor para a UI pública apenas metadados seguros, como `enabled` e `label`.

Isso evita espalhar lógica de segredo e fallback pelas rotas de callback e pela tela de login.

### Estratégia de provedores

Prioridade recomendada:

1. `Google`
2. `Apple`
3. `Facebook`
4. `Instagram` apenas se houver necessidade real validada

Justificativa:

- Google tem fluxo de login web maduro e simples.
- Apple é relevante para confiança e conveniência, especialmente em ecossistema mobile.
- Facebook cobre parte do público Meta e costuma ser mais realista que Instagram para login genérico.
- Instagram deve ser tratado como integração separada, com validação prévia de elegibilidade, permissões e escopo, e não como substituto automático de “entrar com rede social”.

### Observação importante sobre Instagram

O plano deve assumir Instagram como fase opcional até validação funcional do caso de uso. Se a necessidade for apenas “login social para consumidor final”, a prioridade prática deve ficar em Google, Apple e Facebook. Instagram entra apenas se o produto realmente precisar da identidade Instagram ou de recursos da plataforma Meta associados a ela.

### Compatibilidade com email e senha

O login local deve continuar existindo.

Regras sugeridas:

- contas criadas por OAuth podem nascer sem `passwordHash`;
- usuário pode definir senha depois na área autenticada;
- se um email já existir localmente e o provedor devolver o mesmo email de forma confiável, oferecer vínculo seguro em vez de criar conta duplicada;
- quando o provedor não devolver email confiável, exigir etapa complementar para finalizar o cadastro.

### Segurança

- usar `state`, `nonce` e PKCE sempre que suportado;
- nunca confiar em dados de perfil vindos do cliente;
- criptografar tokens de provedor se forem persistidos;
- criptografar `clientSecret`, chaves privadas e outros segredos configurados pelo admin antes de persistir no Mongo;
- nunca devolver segredos do provedor em respostas `GET /api/admin/settings`;
- não salvar `access_token` sem necessidade real de chamadas futuras à API do provedor;
- registrar auditoria mínima de tentativas, vínculo e desvínculo;
- manter rate limiting nas rotas públicas;
- revisar fluxo de CSRF e origem dos callbacks;
- tratar o email do provedor como verificado apenas quando o provedor realmente garantir isso.

### Testes

1. Unit tests:
   - normalização de telefone;
   - normalização de CEP;
   - mapeamento do retorno de lookup para o modelo interno;
   - reconciliação de conta local com identidade social.
2. Integration tests:
   - `register` com lookup bem-sucedido e com falha;
   - email já existente;
   - provedor desabilitado no admin;
   - provedor habilitado sem segredo completo;
   - callback OAuth com usuário novo;
   - callback OAuth com vínculo existente;
   - callback OAuth com email duplicado.
3. Validação manual:
   - autofill do navegador;
   - mobile;
   - habilitar e desabilitar provedores no admin;
   - editar segredos sem reexibir o valor salvo;
   - login social em ambiente local e preview;
   - merge de carrinho após login social.

### Critérios de aceite

- O cadastro continua funcionando com email e senha, sem regressão.
- O formulário aceita telefone internacional com DDI e formatação adequada.
- O CEP brasileiro preenche endereço automaticamente quando possível, sem bloquear o fluxo em caso de falha.
- O usuário consegue entrar com Google na primeira entrega de OAuth.
- O admin consegue habilitar ou desabilitar cada provedor sem editar código.
- As credenciais dos provedores podem ser cadastradas pelo admin sem leitura em texto puro após o salvamento.
- A sessão final continua sendo a sessão própria do projeto.
- Não surgem contas duplicadas para o mesmo email sem regra explícita.
- O fluxo passa em `yarn lint`, `yarn test` e `tsgo`.

### Ordem de entrega sugerida

1. Refatorar formulário e schemas compartilhados.
2. Adicionar telefone internacional.
3. Adicionar lookup de CEP para Brasil.
4. Migrar perfil do usuário para os mesmos componentes.
5. Adicionar infraestrutura administrativa de configuração OAuth.
6. Adicionar Google OAuth.
7. Adicionar Apple.
8. Adicionar Facebook.
9. Reavaliar Instagram com base no caso de uso real e nas exigências do provedor.

## Planejamento: Cupons, promoções, favoritos e alertas de desconto

### Objetivo

Implementar uma base promocional profissional para o ecommerce, cobrindo:

- promoções automáticas em itens;
- cupons de desconto;
- favoritos para clientes autenticados;
- disparo de email quando itens favoritados entrarem em desconto;
- governança administrativa, auditoria, segurança e rastreabilidade.

### Estado atual

- O catálogo e o preço-base vivem na Stripe, com agrupamento por `metadata.slug` e variantes como produtos separados.
- O projeto já usa Mongo para usuários, sessões, `orderDrafts`, categorias, configurações, webhooks e histórico de comunicação.
- O checkout transparente com `PaymentIntent` já recalcula o carrinho no servidor e persiste snapshots antes da confirmação.
- O histórico de emails já fica auditado na coleção `communication`, com tela administrativa e reenvio controlado.

Isso é uma boa base para introduzir um motor promocional em Mongo sem transformar a Stripe em fonte de regras promocionais complexas.

### Diretriz arquitetural

1. A Stripe continua sendo a fonte canônica de catálogo e preço-base.
2. Cupons, promoções, elegibilidade, agendamento e favoritos ficam em Mongo.
3. Toda precificação efetiva deve ser resolvida somente no servidor.
4. O checkout deve congelar a composição de descontos em `orderDrafts` e depois replicá-la para a compra final.
5. Emails de alerta de desconto para favoritos devem ser tratados como comunicação de marketing, nunca como email transacional obrigatório.

### Escopo funcional esperado

1. Promoções automáticas por item, categoria, coleção lógica, variante ou campanha inteira.
2. Cupons aplicáveis no carrinho e no checkout, com remoção, revalidação e mensagens claras.
3. Favoritos por produto ou variante, com listagem na área do usuário.
4. Alertas por email quando um favorito atingir preço promocional elegível.
5. Painel administrativo para criar, agendar, pausar, duplicar, arquivar e auditar promoções.
6. Métricas mínimas de uso, tentativas, conversão e falhas operacionais.

### Modelagem de dados sugerida

#### `promotions`

Coleção principal para regras promocionais.

Campos sugeridos:

- `name`
- `description`
- `status`: `draft | scheduled | active | paused | expired | archived`
- `kind`: `automatic | coupon`
- `scope`: `item | order`
- `benefitType`: `percentage_off | fixed_amount_off | fixed_price`
- `benefitValue`
- `currency`, quando aplicável
- `stackingMode`: `exclusive | combine_with_automatic | combine_with_coupon`
- `targets`
- `eligibility`
- `schedule.startsAt`
- `schedule.endsAt`
- `priority`
- `maxDiscountAmount`
- `usageLimits.global`
- `usageLimits.perCustomer`
- `createdBy`, `updatedBy`
- `createdAt`, `updatedAt`
- `version`

`targets` deve aceitar ao menos:

- `productSlugs`
- `variantIds`
- `categorySlugs`
- `excludeProductSlugs`
- `excludeVariantIds`
- `excludeCategorySlugs`

`eligibility` deve aceitar ao menos:

- subtotal mínimo;
- quantidade mínima por item;
- primeira compra;
- usuários específicos;
- segmentos de clientes;
- email verificado;
- país, se a operação quiser limitar campanhas por mercado.

#### `promotionCodes`

Coleção dedicada aos códigos de cupom.

Campos sugeridos:

- `promotionId`
- `code`
- `codeNormalized`
- `status`
- `singleUse`
- `customerAllowlist`
- `startsAt`
- `endsAt`
- `globalLimit`
- `perCustomerLimit`
- `currentRedemptions`
- `metadata`

Separar código de regra promocional permite:

- mais de um código para a mesma campanha;
- geração em lote no futuro;
- desativação de um código sem matar a campanha inteira;
- auditoria mais clara de abuso e tentativas.

#### `favorites`

Coleção dedicada aos favoritos.

Campos sugeridos:

- `userId`
- `productSlug`
- `variantId`
- `productId`
- `snapshot.name`
- `snapshot.image`
- `snapshot.variantLabel`
- `createdAt`
- `updatedAt`

Índice único sugerido:

- `userId + productSlug + variantId`

Usar coleção própria é preferível a embutir favoritos em `users`, porque:

- reduz crescimento desordenado do documento do usuário;
- facilita índices reversos por produto;
- simplifica os alertas para todos que favoritaram um item;
- melhora relatórios administrativos.

#### `promotionApplications`

Snapshot de aplicação no `orderDraft` e na compra final.

Campos mínimos:

- `promotionId`
- `promotionVersion`
- `promotionKind`
- `promotionCodeId`
- `couponCode`
- `scope`
- `discountAmount`
- `currency`
- `appliedLines`
- `summary`

#### `promotionRedemptions`

Auditoria e concorrência de uso de cupons.

Campos sugeridos:

- `promotionId`
- `promotionCodeId`
- `userId`
- `orderDraftId`
- `purchaseId`
- `status`: `reserved | consumed | released | reversed`
- `reservedAt`
- `consumedAt`
- `releasedAt`

Essa coleção evita corrida de uso em cupons limitados e permite reverter reserva de cupons expirados, pedidos cancelados ou pagamentos não concluídos.

#### `promotionNotifications`

Controle de deduplicação de alertas.

Campos sugeridos:

- `promotionId`
- `userId`
- `productSlug`
- `variantId`
- `effectivePrice`
- `basePrice`
- `status`: `pending | sent | skipped | failed`
- `communicationId`
- `reason`
- `createdAt`
- `sentAt`

Índice único sugerido:

- `promotionId + userId + productSlug + variantId + effectivePrice`

#### Preferências de marketing no usuário

Adicionar em `users` um subdocumento como:

- `marketing.email.optIn`
- `marketing.email.optInAt`
- `marketing.email.optInSource`
- `marketing.email.unsubscribedAt`
- `marketing.email.lastPreferenceChangeAt`

Sem isso, o envio de alerta de desconto corre o risco de misturar comunicação promocional com email obrigatório do pedido.

### Motor de preço e precedência de regras

Fluxo recomendado de cálculo:

1. Resolver o preço-base a partir da Stripe.
2. Aplicar promoções automáticas elegíveis por item.
3. Aplicar cupom elegível sobre o subtotal restante, respeitando a matriz de combinação.
4. Persistir breakdown detalhado no snapshot.
5. Usar somente o total final calculado no servidor para atualizar o `PaymentIntent`.

Regras de precedência recomendadas para a primeira entrega:

- apenas um cupom por pedido;
- no máximo a melhor promoção automática por linha;
- combinação entre promoção automática e cupom controlada por `stackingMode`;
- quando duas combinações forem válidas, escolher automaticamente a melhor para o cliente e registrar a decisão no snapshot.

Campos adicionais recomendados em `orderDrafts`:

- `pricing.baseSubtotal`
- `pricing.itemDiscountTotal`
- `pricing.couponDiscountTotal`
- `pricing.totalDiscount`
- `pricing.finalSubtotal`
- `pricing.appliedPromotions`
- `pricing.quoteExpiresAt`
- `pricing.hash`

`quoteExpiresAt` é importante para evitar divergência quando uma promoção vira enquanto o cliente está com o checkout aberto.

### Cupons no carrinho e no checkout

Comportamento esperado:

1. O cliente informa um cupom no carrinho ou no checkout.
2. O servidor normaliza e valida o código.
3. O carrinho é recalculado no servidor com a promoção aplicada.
4. O `orderDraft` e o `PaymentIntent` são atualizados com o novo total.
5. Se o cupom expirar, ficar inelegível ou exceder limite, o cliente recebe erro claro e o desconto é removido com segurança.

Funcionalidades profissionais esperadas:

- validade por período;
- limite global;
- limite por cliente;
- subtotal mínimo;
- restrição por produto, variante ou categoria;
- restrição por cliente ou segmento;
- primeira compra;
- pausa manual;
- código público ou privado;
- prevenção básica contra brute force por rate limiting.

### Promoções automáticas em itens

Tipos recomendados para a primeira entrega:

- percentual sobre item;
- valor fixo por item;
- preço final fixo por item.

Tipos recomendados para fases posteriores:

- `buy X get Y`;
- combos e kits;
- frete grátis;
- brindes;
- crédito em carteira;
- regras por canal ou campanha externa.

Para storefront e PDP, o sistema deve expor:

- `basePrice`
- `effectivePrice`
- `discountAmount`
- `discountPercentage`
- `compareAtPrice`
- `appliedPromotionLabel`

Assim a interface pode mostrar preço riscado, selo de desconto e economia sem depender de lógica no cliente.

### Favoritos

Primeira entrega recomendada:

1. Favorito apenas para usuário autenticado.
2. Toggle de favorito na listagem e na PDP.
3. Área do usuário com seção `Favoritos`.
4. Remoção rápida da lista.
5. Exibição do preço atual e do status do item.

Fase posterior recomendada:

- favoritos anônimos em `localStorage` ou cookie, com merge ao autenticar.

Decisão recomendada para o domínio:

- favoritar por `productSlug` com `variantId` opcional.

Isso cobre dois cenários:

- interesse no produto como grupo;
- interesse em uma variante específica, quando só ela entrar em promoção.

### Disparo de email quando favorito entra em desconto

O disparo não deve acontecer diretamente na renderização pública nem no clique do cliente.

Arquitetura recomendada:

1. Publicar ou ativar promoção.
2. Enfileirar trabalho para encontrar favoritos impactados.
3. Resolver elegibilidade em lote no servidor.
4. Criar registros `pending` em `promotionNotifications`.
5. Processar envios em batches com rate limiting.
6. Registrar envio final na coleção `communication`.

Condições mínimas para disparo:

- usuário com email válido e verificado;
- consentimento ativo para marketing;
- produto ativo;
- produto disponível para venda;
- preço efetivo realmente menor do que o preço-base ou do que o último preço já notificado;
- ausência de notificação anterior para a mesma combinação de usuário, item, campanha e preço efetivo.

O email deve conter:

- nome do produto;
- variante, quando existir;
- preço anterior;
- preço promocional;
- economia;
- link direto para o produto;
- opção de descadastro.

### Fila, agendamento e execução

O projeto vai precisar de processamento assíncrono para não acoplar alertas ao request do admin.

Abordagem recomendada:

- criar uma coleção `jobs` ou `promotionJobs`;
- disparar jobs em criação, ativação, pausa, expiração e atualização relevante de promoção;
- processar por rota protegida agendada, preferencialmente via cron do ambiente de deploy;
- marcar checkpoints para retomada segura.

Se a aplicação permanecer em Vercel, a rota cron pode ser o caminho inicial mais simples. Se o volume crescer, a mesma modelagem suporta migrar para fila dedicada depois.

### Admin esperado

Seções recomendadas:

1. `/admin/promotions`
2. `/admin/promotions/new`
3. `/admin/promotions/[id]`
4. `/admin/coupons`, caso a equipe queira separar a visão operacional de códigos
5. `/admin/favorites`, ao menos como painel analítico

Capacidades esperadas no admin:

- criar, editar, duplicar, pausar, ativar e arquivar campanha;
- criar cupom vinculado a campanha;
- pré-visualizar itens impactados;
- pré-visualizar quantidade de favoritos impactados;
- visualizar redemptions e tentativas de cupom;
- visualizar alertas pendentes, enviados, ignorados e falhos;
- reprocessar lote falho de alertas;
- auditar quem alterou uma promoção e quando.

### Integração com checkout e pedidos

O checkout transparente atual já oferece o ponto certo para integrar o motor promocional.

Regras recomendadas:

1. O cliente nunca informa desconto monetário; informa apenas o código.
2. O servidor recalcula tudo a partir de Stripe + Mongo.
3. O `PaymentIntent` sempre reflete o total final validado.
4. O webhook replica para a compra final o mesmo snapshot validado.
5. Pagamento falho ou cancelado deve liberar reserva de cupom quando aplicável.

Campos recomendados na compra final:

- `pricing.baseSubtotal`
- `pricing.totalDiscount`
- `pricing.finalSubtotal`
- `pricing.appliedPromotions`
- `pricing.couponCode`
- `pricing.couponCodeId`
- `pricing.priceSource`: `stripe_base + promo_engine`

### Observabilidade e auditoria

Métricas mínimas recomendadas:

- tentativas de aplicar cupom;
- cupons aceitos e recusados;
- receita descontada por campanha;
- favoritos por produto;
- alertas gerados, enviados, clicados e falhos;
- conversão de compra após alerta.

Logs e auditoria:

- toda aplicação de promoção relevante deve ser rastreável pelo `orderDraftId` e `purchaseId`;
- toda tentativa de alerta deve gerar trilha em `promotionNotifications`;
- todo email enviado deve continuar auditado em `communication`, agora com `kind: "marketing"` e template dedicado, por exemplo `favorite-discount-alert`.

### Segurança, compliance e LGPD

- Alertas de desconto por favoritos devem ser opt-in.
- Todo email promocional deve oferecer descadastro funcional.
- O sistema não deve aplicar desconto confiando em preço vindo do cliente.
- A validação do cupom deve ser rate-limited.
- Alterações administrativas em promoções devem ficar auditadas.
- Cupons privados não devem ser expostos em payload público.
- Regras expiradas ou pausadas não podem continuar sendo aceitas por snapshots antigos além do TTL definido.

### Estratégia de rollout

#### Fase 1: fundação

- coleções, índices e tipos;
- motor de elegibilidade e cálculo;
- campos de marketing no usuário;
- snapshots promocionais em `orderDrafts`.

#### Fase 2: favoritos

- toggle de favorito;
- área do usuário;
- painel simples de favoritos por produto.

#### Fase 3: promoções automáticas

- admin de campanhas automáticas;
- preço promocional em storefront, busca e PDP;
- snapshot no checkout.

#### Fase 4: cupons

- campo de cupom no carrinho/checkout;
- validação, reserva, consumo e liberação;
- relatórios administrativos básicos.

#### Fase 5: alertas por email

- fila;
- template;
- job runner;
- painel operacional de alertas.

#### Fase 6: recursos avançados

- favoritos anônimos com merge;
- geração em lote de cupons;
- segmentos avançados;
- BOGO e bundles;
- testes A/B promocionais.

### Critérios de aceite

- O cliente consegue favoritar e desfavoritar produtos sem afetar carrinho ou pedidos.
- O sistema mostra preço promocional coerente em listagem, PDP, carrinho e checkout.
- O total cobrado no `PaymentIntent` sempre corresponde ao snapshot servidor do desconto aplicado.
- Cupons respeitam validade, elegibilidade e limites de uso.
- O sistema não duplica alertas de desconto para a mesma combinação lógica.
- Apenas usuários com consentimento de marketing recebem alerta de favorito em promoção.
- Todo envio promocional fica auditado no admin.
- A solução passa em `yarn lint`, `yarn test` e `tsgo` conforme cada fase for implementada.

## Planejamento: RBAC de Backoffice com `admin` e `vendor`

### Objetivo

Evoluir o backoffice para um modelo formal de papéis e capacidades, no qual:

1. `admin` tenha visão global do negócio, incluindo todos os usuários, todos os pedidos e todo o catálogo.
2. `admin` não possa atuar como comprador na storefront nem iniciar checkout.
3. `vendor` seja um novo tipo de usuário com acesso ao backoffice, porém mais limitado do que `admin`.
4. A migração aconteça sem impacto funcional no sistema atual de clientes, checkout, catálogo e sessões já em produção.

### Diagnóstico atual

- O sistema atual trabalha essencialmente com dois papéis: `admin` e `customer`.
- A autorização está distribuída em checks diretos de `role === "admin"` em páginas, layout, middleware/proxy e helpers.
- Parte das Server Actions administrativas ainda valida apenas autenticação, não capacidade específica, o que hoje funciona porque a UI e as rotas já isolam o admin, mas não escala com segurança para novos papéis.
- O catálogo administrativo atual é global por natureza, porque lê a Stripe inteira e agrupa produtos por `metadata.slug`; ainda não existe no modelo um conceito de “produto pertencente a um usuário”.
- O fluxo de checkout não foi desenhado explicitamente para bloquear perfis internos como `admin`.

### Requisitos funcionais

#### Papel `admin`

- Deve continuar acessando todo o `/admin`.
- Deve ver todos os produtos do catálogo, independentemente de autoria futura.
- Deve ver todos os usuários cadastrados.
- Deve ver todos os pedidos e alterar seus status operacionais permitidos.
- Deve criar, editar, ativar, pausar e arquivar promoções e cupons.
- Deve gerenciar configurações globais da plataforma.
- Não deve conseguir comprar como cliente enquanto estiver com papel `admin`.
- Não deve possuir carrinho ativo, checkout ativo ou métodos de pagamento de cliente para uso operacional.

#### Papel `vendor`

- Deve conseguir autenticar no mesmo fluxo base de login e sessão do admin atual, sem abrir um stack paralelo de autenticação.
- Deve poder acessar o backoffice com navegação própria por capacidade.
- Deve poder criar e editar cupons e promoções.
- Deve poder visualizar clientes cadastrados.
- Deve poder visualizar pedidos e alterar status de compras dentro das regras operacionais definidas.
- Não deve poder acessar configurações globais sensíveis.
- Não deve poder promover usuários, alterar papéis, mexer em segredos, OAuth, webhooks, emails sistêmicos ou configurações regionais globais.
- Não deve poder atuar como comprador na storefront, assim como `admin`.

#### Visão de produtos

- No estado atual, `admin` já deve ser tratado como operador de catálogo global, porque o catálogo administrativo vem da Stripe inteira.
- Se o produto `vendor` futuramente precisar enxergar apenas um subconjunto do catálogo, será necessário introduzir propriedade explícita no catálogo, por exemplo via Mongo e/ou `metadata` canônica na Stripe.
- Enquanto não existir propriedade de catálogo por usuário, `vendor` deve ser considerado operador limitado por capacidade, e não por escopo de produto.

### Requisitos não funcionais

#### Segurança

- A autorização deve migrar de checks binários de papel para uma camada central de capacidades.
- Toda rota `/admin`, action, route handler e loader de dados administrativos deve validar capacidade explícita no servidor.
- O papel persistido na sessão deve ser normalizado sem rebaixar silenciosamente `vendor` para `customer`.
- Fluxos de compra devem bloquear papéis internos no servidor, não apenas esconder botões na UI.

#### Compatibilidade

- Usuários `customer` existentes não podem sofrer alteração de fluxo.
- Usuários `admin` existentes devem continuar logando sem migração destrutiva.
- O valor default para documentos antigos sem `role` deve continuar sendo `customer`.
- A migração deve ser aditiva: introduzir `vendor` e capacidades sem exigir reescrita completa de autenticação.

#### Auditoria

- Alterações de status de pedido, promoções e cupons devem registrar `updatedBy`, `updatedRole` e timestamp.
- Criação futura de `vendor` deve registrar autor da concessão e origem da permissão.

### Arquitetura recomendada

#### Separar papel de capacidade

Introduzir um modelo canônico com:

- `role`: `admin | vendor | customer`
- `capabilities`: resolvidas no servidor a partir do `role`

Matriz inicial sugerida:

- `admin`
  - `admin.access`
  - `catalog.read`
  - `catalog.write`
  - `orders.read`
  - `orders.update_status`
  - `customers.read`
  - `promotions.read`
  - `promotions.write`
  - `settings.read`
  - `settings.write`
  - `webhooks.read`
  - `emails.read`
  - `staff.manage`
- `vendor`
  - `admin.access`
  - `catalog.read`
  - `orders.read`
  - `orders.update_status`
  - `customers.read`
  - `promotions.read`
  - `promotions.write`
- `customer`
  - `storefront.buy`
  - `account.self`

#### Criar helpers centrais de autorização

Adicionar helpers server-only, por exemplo:

- `getSessionRole()`
- `getSessionCapabilities()`
- `requireCapability("orders.update_status")`
- `requireBackofficeAccess()`
- `isInternalOperatorRole()`

Esses helpers devem substituir checks soltos de `session.user.role !== "admin"` e `requireAdmin()` ao longo do tempo.

#### Bloquear compra para papéis internos

Bloquear `admin` e `vendor` em:

- leitura e mutação de carrinho autenticado;
- criação e atualização de `PaymentIntent`;
- aplicação de cupom no carrinho;
- criação de `Checkout Session` legado, enquanto existir;
- qualquer fluxo que persista compra em `users.purchases`.

O bloqueio deve devolver erro explícito e previsível no servidor, com mensagem operacional adequada para UI futura.

#### Preservar o modelo de sessão atual

- O payload da sessão e seus tipos devem aceitar `vendor`.
- O login, OAuth e criação de sessão persistente devem parar de colapsar qualquer papel diferente de `admin` para `customer`.
- O middleware/proxy deve usar capacidade de backoffice, não um check fixo de `admin`.

### Plano de implementação por fases

#### Fase 1. Hardening invisível

- Introduzir tipos `UserRole` e matriz de capacidades.
- Atualizar sessão, login, OAuth e helpers para preservar `vendor`.
- Criar `requireCapability`.
- Trocar guardas mais sensíveis de backend por capacidade.
- Adicionar bloqueio server-side de compra para papéis internos.

Critério de saída:

- `admin` continua funcionando como hoje.
- `customer` não percebe mudança.
- Fluxos de compra recusam `admin` no servidor.

#### Fase 2. Introdução do `vendor`

- Permitir persistir usuários com `role: "vendor"`.
- Liberar acesso ao `/admin` para qualquer papel com `admin.access`.
- Esconder ou negar superfícies sem capacidade: settings, webhooks, emails administrativos completos e gestão de staff.
- Ajustar sidebar/topbar do admin conforme capacidades disponíveis.

Critério de saída:

- `vendor` entra no backoffice e só vê o que pode usar.
- Nenhuma rota sensível responde somente por confiança na navegação.

#### Fase 3. Auditoria e governança

- Registrar papel/capacidade na autoria de promoções, cupons e mudanças de pedido.
- Criar telas ou filtros para diferenciar ações de `admin` e `vendor`.
- Avaliar fluxo de criação e gestão de staff no admin.

#### Fase 4. Escopo opcional por catálogo

- Só executar se houver requisito real de multioperador por carteira de produtos.
- Introduzir propriedade canônica de catálogo por usuário ou equipe.
- Filtrar listagens de produtos, pedidos e promoções por escopo, mantendo `admin` global.

### Impacto esperado por área

#### Autenticação e sessão

- Baixo risco, desde que a mudança seja aditiva e com fallback para `customer`.

#### Admin

- Risco médio, porque há vários checks diretos de `admin` espalhados.
- O maior cuidado é centralizar autorização antes de abrir o acesso para `vendor`.

#### Checkout e carrinho

- Risco médio e sensível, porque o bloqueio de compra para papéis internos precisa ocorrer sem afetar clientes reais.
- Exigir testes direcionados em `cart-actions`, `checkout-actions` e `order-actions`.

### Casos de teste obrigatórios

- `customer` consegue logar, manter carrinho e comprar normalmente.
- `admin` consegue entrar no backoffice, ver usuários, pedidos e produtos, mas não consegue comprar.
- `vendor` consegue entrar no backoffice, criar cupom, alterar status de compra e ver clientes.
- `vendor` recebe `403` ao acessar configurações globais, webhooks, gestão de staff e demais superfícies exclusivas de `admin`.
- APIs e Server Actions administrativas negam acesso quando chamadas diretamente sem a capacidade correta.
- Sessões antigas de `customer` e `admin` continuam válidas dentro do comportamento esperado.

### Recomendações objetivas

1. Implementar primeiro o bloqueio de compra para papéis internos e a camada de capacidades.
2. Só depois liberar o novo papel `vendor` na autenticação e na UI do admin.
3. Não introduzir ainda “produtos por usuário” se o requisito imediato é apenas diferenciar poderes operacionais; isso adicionaria complexidade desnecessária agora.
