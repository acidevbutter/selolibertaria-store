# UI & UX Patterns

## Objetivo

Consolidar os padrões de interface e experiência atualmente implementados no projeto para que novas mudanças preservem consistência visual, hierarquia de ações e comportamento esperado nas principais superfícies da loja e do admin.

## Escopo

Este documento descreve o estado atual da UI/UX em produção no repositório, com foco em:

- devbutterstore;
- autenticação e cadastro;
- carrinho e checkout;
- conta do usuário;
- superfícies administrativas.

Ele complementa regras especializadas, como [AUTH_SOCIAL_BUTTON_PATTERN.md](./AUTH_SOCIAL_BUTTON_PATTERN.md).

## Fontes canônicas do estado atual

- `src/ui/auth/oauth-buttons.tsx`
- `src/ui/auth/register-form.client.tsx`
- `src/ui/auth/address-fields.client.tsx`
- `src/ui/profile-editor.client.tsx`
- `src/components/cart-sidebar.tsx`
- `src/app/checkout/checkout-form.client.tsx`
- `src/ui/products/product-list.tsx`
- `src/app/(store)/product/[slug]/page.tsx`
- `src/app/(store)/product/[slug]/product-image-gallery.client.tsx`
- `src/ui/footer/footer.client.tsx`
- `src/app/user/page.tsx`
- `src/app/admin/promotions/page.tsx`
- `src/app/admin/emails/_components/email-log-table.client.tsx`
- `src/app/admin/webhooks/page.tsx`

## Princípios globais

### 0. Rebrand do Selo Libertária

- O rebrand deve assumir linguagem adulta, quente e autoral, sem infantilização e sem estética de sex shop.
- A referência prioritária de tom visual é uma livraria-editora cultural contemporânea.
- Enquanto a direção final não for escolhida, usar `Editorial Noturno` como trilha preferencial de exploração.
- `Editorial Noturno` significa: fundos profundos, acentos quentes, composição editorial, contraste alto e erotismo sugerido pela linguagem visual, não por clichês.
- `Barroco Contemporâneo` e `Urbano Sensual Minimalista` podem servir como variantes de estudo, mas não devem ser misturados sem uma decisão explícita de direção de arte.

### 1. Preservar a DevButterStore por padrão

- Não alterar layout, tipografia, cores, hierarquia visual ou copy pública sem necessidade explícita do requisito.
- Mudanças técnicas devem reaproveitar a linguagem visual existente em vez de redesenhar a superfície.

### 1.1. Base visual genérica e rebrandable

- A DevButterStore atual deve funcionar como base genérica para uma futura marca.
- Nome, ícone, imagens editoriais, emails, textos institucionais e metadata devem permanecer neutros e facilmente substituíveis.
- Evitar elementos visuais excessivamente autorais, agressivos ou presos a uma identidade específica sem pedido explícito.

### 2. Cards e blocos com borda suave

- O projeto usa com frequência containers com `rounded-xl` ou `rounded-2xl`, exceto nos cards de produto da selolibertaria, que devem permanecer sem cantos arredondados.
- Blocos informativos e formulários costumam usar borda discreta, fundo `bg-card`, `bg-card/60` ou `bg-muted/10`.
- Estados secundários usam `text-muted-foreground` e mensagens curtas de apoio abaixo do campo ou da seção.

### 3. Hierarquia de ação simples

- Ação primária: botão sólido em tom neutro, geralmente escuro ou usando o botão padrão do sistema.
- Ações secundárias: `outline`, `secondary` ou links sublinhados.
- Ações destrutivas: texto em vermelho, botão secundário com destaque sem competir com a CTA principal.

### 4. Densidade controlada

- Formulários longos devem ser quebrados em grupos ou seções.
- Tabelas administrativas mostram só o essencial; detalhes densos devem abrir em modal, popup ou `details`.
- Textos de ajuda devem explicar intenção, não repetir o label.

### 5. Mobile-first com ganho progressivo

- Listas e grids partem de uma coluna e ganham `sm`/`lg`/`xl` conforme o espaço.
- Formulários usam uma coluna no mobile e duas colunas quando isso reduz altura sem prejudicar leitura.
- Elementos críticos, como CTA e inputs, permanecem utilizáveis sem depender de hover.

### 6. Idioma por superfície

- Há convivência de inglês e pt-BR no produto atual.
- Superfícies novas de promoção, favoritos administrativos e preferências de marketing já introduzem mais pt-BR.
- Ao evoluir uma tela, manter o idioma dominante daquela superfície e evitar blocos mistos dentro do mesmo componente.
- Ao corrigir localização pública em `pt-BR`, incluir também `aria-label`, placeholders, mensagens transitórias e estados vazios na mesma passada; textos autorais ou operacionais cadastrados pelo admin ficam fora dessa normalização e devem permanecer como conteúdo-fonte.
- A DevButterStore deve resolver idioma por requisição sem mudar a URL visível: idioma suportado do dispositivo quando disponível, com fallback para o idioma padrão configurado no admin e, por fim, para `en-US`.
- Para QA, suporte e testes de localização, a selolibertaria pode aceitar um prefixo temporário como `/en`, `/en-us`, `/pt-br` ou `/es`, mas esse acesso deve apenas gravar o cookie de locale e redirecionar em seguida para a URL canônica sem prefixo.
- Campos compartilhados com país, moeda, datas e checkout devem espelhar o locale resolvido daquela sessão, sem duplicar layouts ou criar variantes visuais por idioma.
- Quando a pessoa usuária tiver uma moeda preferida salva, cadastro, perfil, favoritos, carrinho e checkout devem tentar refletir essa moeda de forma consistente; se a Stripe não oferecer aquela moeda no preço correspondente, a interface deve cair de forma silenciosa e coerente para a moeda padrão do produto, sem exibir mensagens técnicas.
- Em `/checkout/processing`, o loading deve ser sempre temporário: a tela pode aguardar alguns segundos por confirmação autoritativa, mas deve redirecionar automaticamente para a área de pedidos após no máximo `15s` sem confirmação final; em estados autoritativos de disputa/análise, pode interromper o loading antes e orientar acompanhamento por e-mail e na área de pedidos.
- Em dashboard, área de pedidos e modais associados, aliases técnicos de disputa ou revisão não devem aparecer crus para a pessoa usuária; a interface precisa consolidá-los em estados claros como `Disputed`, `Won` ou `Lost`.

## Padrões por superfície

## Autenticação e cadastro

### Login social

- Login por email e senha continua como fluxo primário.
- OAuth aparece como grupo secundário centralizado abaixo da ação principal.
- O trilho social usa coluna única, largura máxima de `22rem` e botões de `44px`.
- Google mantém fundo claro e ícone oficial; demais provedores seguem a mesma estrutura visual do sistema.

### Login editorial do Selo Libertária

- Em `Editorial V2`, a tela de login deve parecer uma página editorial do próprio site, não um modal ou card SaaS pousado no centro.
- A composição preferencial no desktop é um `spread` em duas colunas: conteúdo e formulário à esquerda, capa/livro protagonista à direita.
- O header da tela de login deve repetir o header editorial do sistema, preservando continuidade visual com home, catálogo e PDP.
- O formulário deve usar fundo papel, bordas retas, labels em caixa alta discreta e apenas uma CTA primária forte.
- O submit e o trilho de OAuth devem compartilhar a mesma largura máxima para reforçar alinhamento visual.
- A coluna visual deve usar capa de livro real ou arte do acervo como protagonista, com bloco-quote curto sobreposto para criar atmosfera.
- No mobile, a hierarquia deve virar pilha: header, texto de entrada, formulário, OAuth, bloco visual reduzido.

### Cadastro

- No contexto do `/login` editorial do Selo Libertária, o cadastro deve ser progressivo e dividido em etapas curtas, não apresentado como um bloco longo único.
- A sequência preferencial é:
  - `Conta`
  - `Entrega`
  - `Preferências`
- A etapa `Conta` deve concentrar apenas o essencial para a decisão inicial: nome, email, telefone e senha.
- O endereço completo deve entrar apenas depois que a pessoa conclui a primeira etapa, reduzindo sensação de esforço antes do compromisso.
- A última etapa deve ficar mais leve, reservando preferências como moeda e opt-in de marketing para o fim.
- A seção `Account` pode incluir preferências primárias da conta, como moeda preferida, desde que isso não desloque a CTA principal nem quebre a leitura em mobile.
- Campos de erro aparecem em banner superior com borda e fundo de erro.
- Disponibilidade de email é validada de forma assíncrona com feedback curto.
- A senha mostra checklist visual de força.
- O opt-in de marketing aparece como card/checkbox explicativo, não como linha seca de formulário.

### Telefone e endereço

- Telefone usa campo compartilhado com país e DDI.
- Endereço usa primitivas reutilizáveis com `CountrySelect`.
- Para Brasil, o CEP dispara busca automática ao completar 8 dígitos.
- `logradouro`, `bairro`, `cidade` e `estado` podem ser preenchidos automaticamente e bloqueados após sucesso do lookup.
- Status do lookup fica fora do grid principal para não desalinha os campos.

### Perfil

- Preferências persistentes da conta, como marketing e moeda preferida, devem viver no editor de perfil, com ajuda curta logo abaixo do controle quando houver fallback funcional importante.

## Catálogo e PDP

### Footer da selolibertaria

- A faixa inferior do footer deve manter copyright e métodos de pagamento como conteúdo primário.
- Créditos externos de desenvolvimento, quando existirem, devem aparecer na mesma faixa inferior, em formato inline, com link externo, ícone da marca e nome visível.
- O crédito deve permanecer secundário, com wrap natural no mobile, sem competir com newsletter, navegação ou ícones de pagamento.
- A identidade visual do footer deve permanecer neutra, sem depender de slogans ou estética exclusiva de uma marca anterior.

### Home do Selo Libertária

- A home do rebrand deve seguir a trilha `Editorial Noturno`.
- Em redesigns aprovados como `Editorial V2`, aplicar a versão clara dessa linguagem: fundo papel `#F7F4EF`, texto `#0B0B0B`, acento vinho `#7A1E22`, apoio bege `#D8D0C4`, ritmo de revista e hero com respiro mais amplo.
- A primeira dobra precisa unir posicionamento e ação comercial no mesmo quadro.
- O título principal da home deve comunicar explicitamente literatura, livraria-editora ou proposta cultural adulta; evitar hero genérico de lifestyle.
- A CTA primária da home deve levar para livros ou loja.
- A CTA secundária deve abrir a camada cultural, como agenda, projetos ou Sarau Safado.
- O miolo da home deve alternar ritmo entre:
  - bloco de conversão;
  - bloco de contexto;
  - bloco de prova cultural ou visual.
- Vitrines de produto na home do Selo Libertária devem usar microcopy curatorial curta abaixo ou ao lado do título, para parecerem seleção editorial e não grade promocional pura.
- Se houver mosaico visual ou trecho literário, ele deve funcionar como respiração dramática entre blocos mais utilitários.
- A home não deve terminar abruptamente em rodapé; precisa haver um fechamento com convite a acompanhar programação, contato ou newsletter.

### Páginas institucionais do Selo Libertária

- `events`, `projects` e `sarau-safado` não devem se resolver apenas como listas de cards homogêneos.
- Cada página institucional precisa combinar pelo menos três ritmos:
  - um hero ou bloco de entrada forte;
  - um bloco de leitura editorial ou princípio curatorial;
  - um bloco de continuidade com links claros para catálogo, agenda, contato ou páginas irmãs.
- Quando `sarau-safado` receber imagem no hero via admin, essa mídia deve ocupar o fundo da abertura principal e o texto precisa ficar sobreposto em um bloco de leitura protegido por contraste, para que a imagem funcione como capa e não como card lateral.
- Em listagens editoriais, vale alternar resumo e descrição em duas colunas internas do card para evitar uma leitura longa e monótona.
- Blocos laterais com “eixos”, “sinais” ou “ritmo da programação” ajudam a dar densidade cultural sem transformar a página em manifesto puro.

### Listagem de produtos

- Grade responsiva `1 -> 2 -> 3` colunas.
- Em `Editorial V2`, a imagem/capa deve ganhar quadro mais alto e mais área útil do que no card comercial genérico, preservando cantos externos retos e quick actions discretas sobre a mídia.
- Antes da grade, a listagem pode usar um bloco curto de leitura editorial para enquadrar o catálogo e quebrar a sensação de página puramente utilitária.
- Card de produto usa imagem quadrada com fundo neutro, borda suave, cantos retos e hover sutil na mídia.
- Todos os cards da listagem devem manter o mesmo formato e a mesma altura visual; nome, preço e área de variantes precisam reservar espaço consistente, e a imagem do produto é que deve se adaptar ao quadro.
- O título do produto no card deve ter presença suficiente para leitura rápida, com escala acima do corpo de preço sem perder o limite de duas linhas.
- Cards de produto devem expor uma camada de quick actions:
  - favorito flutuante no canto superior direito;
  - CTA primária compacta no canto inferior direito, em formato de cápsula/círculo com `+`, expandindo para `Add to cart` no hover e no foco por teclado com transição suave, contínua e de pelo menos `1s`; quando expandida sobre vermelho, o texto deve ficar preto;
  - no mobile, a CTA deve permanecer visível sem depender de hover.
- Quando houver múltiplas variantes, os chips abaixo do preço devem permitir seleção direta no card e atualizar o preço exibido e o item que será adicionado ao carrinho.
- Preço promocional é o valor principal; preço-base aparece riscado em `muted`.
- Variantes múltiplas aparecem como chips arredondados abaixo do preço; a opção ativa precisa ficar visualmente destacada, com sensação leve de expansão e rótulo escuro sobre o destaque vermelho.
- O card inteiro continua navegável para a PDP, mas as quick actions precisam interceptar clique/toque sem disparar navegação acidental.
- No rebrand do Selo Libertária, a vitrine deve parecer mais editorial do que varejista: menos ruído promocional, mais espaço para capa, título e microcopy curatorial.
- Sempre que possível, incluir microcopy curatorial curta no card ou na listagem para que a grade pareça seleção, não atacado.

### Página de produto

- Breadcrumb curto e funcional no topo.
- Título e favorito compartilham a primeira linha de destaque.
- Preço promocional usa destaque principal; preço-base fica riscado logo abaixo.
- Nome/label de promoção, quando existir, aparece em texto pequeno, vermelho e em caixa alta.
- Variações usam `Badge`/chips com estado ativo claro.
- CTA de compra fica isolada e visualmente forte.
- Em contexto Selo Libertária, a PDP deve combinar compra e atmosfera: trecho, contexto da obra, referências visuais ou críticas podem aparecer abaixo da dobra, sem disputar com a ação principal.
- Abaixo da dobra, a PDP deve ter mais de um ritmo: contexto editorial, caminhos de continuidade e uma leitura curta sobre como aquela obra se insere no ecossistema do selo.
- No admin editorial do Selo Libertária, formulários longos devem seguir o mesmo padrão de seções curtas já usado em produtos: blocos separados para identidade, texto, mídia, publicação e itens repetíveis, reduzindo carga cognitiva mesmo quando a superfície for institucional, como `Sarau Safado`.
- Em uploads de imagem do admin editorial, o comportamento preferencial deve ser explícito: selecionar arquivo, ver prévia local e concluir o envio ao salvar o formulário. O sistema não deve depender visualmente de upload automático silencioso para transmitir confiança.
- Em uploads por arquivo no admin, a revisão da imagem deve acontecer em modal antes da confirmação final. O padrão esperado é: selecionar arquivo, abrir prévia ampliada, escolher entre `Salvar` ou `Descartar` e só então manter a seleção ou disparar o upload.
- Quando uma área administrativa tiver mais de uma superfície editorial relacionada, o padrão deve prever um hub simples de entrada e um card lateral de resumo operacional; isso ajuda a pessoa operadora a se orientar sem transformar o fluxo em dashboard pesado.
- Páginas institucionais administráveis, como `about` e `contact`, devem ser modeladas no admin como blocos nomeados e editáveis por seção (`hero`, bloco principal, cards, links), em vez de um campo único de texto longo; isso preserva intenção visual e reduz risco de quebrar a composição pública.
- Na home administrável, editar conteúdo não deve capturar seções cuja fonte já é outra, como catálogo, eventos e projetos; o padrão ideal é uma home híbrida, em que os blocos institucionais ficam em um documento de página e os blocos programáticos continuam ligados às suas coleções próprias.
- Em listagens editoriais administrativas, ordenação recorrente deve aparecer como affordance explícita e de baixa fricção. Botões de subir/descer perto da linha atual resolvem bem a fase inicial sem introduzir a complexidade visual de drag-and-drop.
- Em `/admin` e `/login`, overlays globais de loading não podem bloquear clique, seleção de arquivo ou submit. Qualquer splash deve ser ignorado nessas rotas para preservar resposta imediata de backoffice e autenticação.

### Galeria de produto

- Imagem principal com CTA implícita de zoom.
- Navegação lateral quando há múltiplas imagens.
- Faixa de miniaturas horizontal abaixo da imagem principal.
- Modal ampliado com zoom interativo guiado pelo cursor e navegação anterior/próxima.

## Carrinho e cupom

### Sidebar

- Carrinho abre em painel lateral fixo com overlay escurecido e blur.
- Header compacto com contador e ação de fechar.
- Estado vazio é centralizado com ícone e mensagem curta.
- Linhas de item mostram:
  - miniatura;
  - nome;
  - preço atual;
  - preço-base riscado quando houver desconto;
  - stepper de quantidade;
  - remoção direta.

### Cupom e resumo

- O cupom vive em card próprio dentro do footer do carrinho.
- Campo, botão `Aplicar`, estado ativo e ação `Remover` ficam no mesmo bloco.
- Resumo mostra subtotal, desconto e total final.
- O carrinho deve refletir imediatamente o snapshot retornado pela Server Action ao aplicar/remover cupom.

## Checkout

### Estrutura

- Checkout usa card único com borda e sombra leve.
- Quando existem cartões salvos, a escolha aparece antes do `PaymentElement`.
- Métodos salvos usam cards clicáveis com `RadioGroup`.
- A opção de novo método fica no mesmo conjunto visual dos cartões salvos.

### Entrega

- O checkout precisa perguntar explicitamente como a pessoa quer receber o pedido antes da etapa de pagamento.
- A escolha principal deve ser um grupo claro com três caminhos:
  - usar o endereço já salvo no cadastro;
  - informar um novo endereço de entrega;
  - retirar na loja.
- O bloco de entrega deve aparecer acima do pagamento e antes do resumo final para evitar surpresa no total.
- Ao escolher o endereço cadastrado, a interface deve mostrar um resumo curto do endereço e o prazo estimado da entrega.
- Ao escolher um novo endereço, o formulário deve reaproveitar as primitivas de endereço já existentes no produto, sem criar campos paralelos.
- Ao escolher retirada, a interface deve destacar prazo de preparo, valor estimado e o fato de que não haverá custo de frete de entrega.
- As opções de entrega devem mostrar preço estimado e prazo ao lado do rótulo principal, sem mensagens técnicas.

### Frete

- Quando o frete estiver habilitado, o resumo do pedido deve exibir a cotação como bloco próprio, logo acima do total final.
- As opções de frete devem aparecer como cards ou radios com `service`, `price` e `estimatedDays`, preservando leitura rápida no mobile.
- A pessoa usuária deve conseguir ver quando o frete está disponível, indisponível ou expirado sem mensagens técnicas.
- Se a cotação falhar, a interface deve manter o restante do checkout utilizável e orientar a atualização do endereço ou a nova tentativa.
- A escolha de frete precisa ficar congelada junto do snapshot do pedido para evitar variação silenciosa depois da confirmação.

### Feedback e confiança

- Checkbox de salvar método de pagamento aparece em card explicativo.
- Mensagens de erro aparecem em caixa com borda e fundo vermelho claro.
- CTA muda de rótulo conforme o método escolhido:
  - `Pay now`
  - `Pay with saved card`
- Rodapé de confiança informa que os dados são processados pela Stripe.

## Conta do usuário

### Estrutura

- Página usa sidebar esquerda fixa/sticky com navegação por seções.
- Conteúdo principal troca por `section` em query string.

### Perfil

- Editor reutiliza os mesmos primitivos de telefone e endereço do cadastro.
- Email não verificado exibe banner amarelo com ação explícita de reenvio.
- Opt-in de marketing também aparece no perfil para ajuste posterior.

### Favoritos

- Favoritos usam grade de cards.
- Cada card mostra:
  - nome;
  - variante, se houver;
  - preço atual;
  - preço-base riscado quando houver promoção;
  - toggle de favorito;
  - link para o produto.

### Métodos de pagamento

- A conta possui seção dedicada para métodos salvos.
- A comunicação reforça que os dados completos ficam na Stripe, não na aplicação.

## Admin

### Dashboard administrativo

- O dashboard do admin deve funcionar como painel de decisão, não apenas como resumo decorativo de números.
- No `Desktop / Admin Conceitual`, a sidebar é um trilho preto fixo e silencioso; a área principal trabalha em papel claro com bordas retas e sem visual translúcido.
- A DCC Ash deve ficar concentrada na assinatura da marca e em acentos pontuais; títulos operacionais longos do dashboard precisam usar uma leitura mais sóbria para não sacrificar legibilidade.
- A primeira dobra precisa responder rapidamente:
  - quanto entrou;
  - quantos pedidos exigem ação;
  - onde está o gargalo operacional;
  - se há risco técnico afetando a loja.
- Cards de KPI devem ser curtos, comparáveis e semanticamente estáveis entre períodos.
- Status de pagamento e status de fulfillment devem aparecer em blocos separados; misturar os dois no mesmo gráfico reduz clareza operacional.
- Métricas com necessidade de ação, como disputas, falhas, webhooks pendentes ou pedidos pagos sem andamento, devem ter mais contraste visual do que métricas puramente históricas.
- Toda métrica crítica do dashboard deve oferecer drilldown natural para a tela operacional correspondente, como pedidos, webhooks ou emails.
- Séries temporais devem priorizar leitura de tendência real da loja, especialmente receita paga, descontos e variação por período, evitando gráficos redundantes que só repetem o total.

### Produtos

- O formulário administrativo de produto deve separar informações em blocos curtos e nomeados, como `Product details`, `First variant`, `Pricing` e `Availability`, para reduzir leitura linear excessiva.
- O estado de ativação do produto ou da variante deve usar linguagem de negócio, como `Active`, `Inactive` e `Deactivate`, sem mencionar Stripe no texto visível.
- A página de edição de produto deve manter uma visão geral das variantes na própria tela, com cards ou linhas resumidas mostrando status, preço, estoque e ordem.
- Criação e edição de variante devem acontecer em modal focado, preservando o contexto do produto ao fundo e evitando abas longas para cada variante.
- O modal de variante deve reforçar o que é herdado do grupo e o que é específico da variante, principalmente nome herdado, imagens herdadas, preço herdado versus preço customizado e disponibilidade.

### Promoções e cupons

- A página usa header simples com ação operacional secundária no topo.
- Cards de campanha combinam:
  - título e descrição;
  - badges de status/tipo/escopo;
  - mini-métricas em blocos;
  - ações rápidas de status.
- O formulário é longo, então deve ser agrupado em seções tipo sanfona:
  - `Dados básicos`
  - `Desconto e publicação`
  - `Regras e validade`
  - `Alvos e alertas`
- Um resumo numérico do fluxo aparece antes das seções para orientar o usuário.
- Edição inline deve reaproveitar a mesma estrutura do formulário de criação.

### Frete

- A administração de frete deve seguir a mesma lógica de blocos curtos, com lista de provedores, status de saúde e ação clara para ativar, desativar ou priorizar.
- Credenciais e regras de frete devem ficar em seções separadas para evitar misturar configuração técnica com política comercial.
- O admin de frete deve tratar `Correios`, `Jadlog`, `EasyPost` e `Custom HTTP` como famílias de provider distintas, exibindo apenas os campos técnicos esperados por cada API e mascarando credenciais já salvas.
- Falhas recentes, último preço válido e serviços ativos precisam ser visíveis sem exigir navegação para uma tela de log cru.

### Emails administrativos

- A grade principal deve permanecer enxuta: data, status, tipo e destinatário.
- Selecionar uma linha abre modal grande com duas áreas:
  - metadados e ações na lateral;
  - preview renderizado ou conteúdo textual na área principal.
- Reenvio por `API` e `SMTP` fica visível no próprio modal.

### Webhooks

- A tabela principal mostra status, verificação, tipo, `eventId` e erro.
- Payloads extensos não devem aparecer inline.
- O detalhamento usa `details/summary` com `pre` scrollável para headers e payload.

### Pedidos

- A página administrativa de pedido deve manter o bloco operacional de fulfillment perto do resumo principal, para que a pessoa operadora entenda o contexto antes de alterar status ou rastreio.
- O identificador principal visível de um pedido deve ser o id interno da aplicação, não um id técnico bruto da Stripe como `pi_...`.
- Toda alteração manual relevante em pedido, especialmente fulfillment e tracking number, deve aparecer em um bloco próprio de histórico de edição logo abaixo do conteúdo operacional.
- O histórico de pedido deve mostrar quem alterou, quando alterou e os valores anterior e novo de forma legível para auditoria rápida.
- Após salvar fulfillment no admin, a tela do pedido deve refletir o novo histórico imediatamente, sem exigir recarga manual da página.

### Papéis internos e navegação

- O backoffice deve tratar `admin` e futuros papéis internos, como `vendor`, como operadores e não como compradores.
- A navegação administrativa deve revelar apenas áreas compatíveis com as capacidades do papel logado, reduzindo ruído e evitando expor ações sem permissão.
- A ausência de permissão deve preferir remoção da entrada de navegação e, como segunda linha de defesa, resposta `403` no servidor.
- A selolibertaria pública não deve ganhar CTAs de compra adaptadas para papéis internos; para esses perfis, o comportamento esperado é bloqueio operacional no backend e mensagens administrativas claras quando necessário.
- Superfícies de gestão de usuários no admin devem separar claramente leitura de perfil, papel atual e estado de acesso; ações de promover, rebaixar, bloquear e desbloquear devem ficar agrupadas em um bloco operacional distinto e só aparecer para `admin`.
- A página administrativa de produto deve expor histórico de edição em um bloco próprio abaixo da configuração principal e das variantes, mostrando quem alterou, quando alterou e um resumo técnico curto da mudança.

## Padrões de disclosure e redução de ruído

- Use `details/summary` para:
  - edição contextual;
  - payloads técnicos;
  - grupos longos de formulário.
- Use `Dialog` para:
  - prévias renderizadas;
  - inspeção detalhada com necessidade de foco;
  - ações secundárias que exigem contexto lateral.

## Padrões de feedback

- Sucesso curto: texto verde simples ou toast.
- Erro recuperável: banner ou bloco com borda/fundo do estado de erro.
- Loading pequeno: texto curto ou label temporário no botão.
- Estados vazios: borda tracejada ou bloco neutro com mensagem centralizada.

## Checklist para novas telas

- A superfície já existente pede preservação visual ou permite redesign?
- O bloco pode ser dividido em grupos antes de virar uma sequência longa de inputs?
- Os detalhes densos estão fora da grade principal?
- A ação primária está clara e única?
- O comportamento mobile continua legível?
- O idioma da superfície permaneceu consistente?
- O componente reutiliza primitives já existentes antes de criar um padrão novo?

## Manutenção

- Mudanças relevantes de UI/UX devem atualizar este arquivo, `AGENTS.md`, `CHANGELOG.md` e, quando aplicável, documentos especializados como `AUTH_SOCIAL_BUTTON_PATTERN.md`.
