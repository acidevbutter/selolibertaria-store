# User Experience

## Fonte canônica

- O documento principal de experiência continua sendo `UI_UX_PATTERNS.md`.
- O inventário funcional que deve orientar briefings de UI/UX fica em `spec.md`.
- Este arquivo destaca intenções de uso e comportamento para mudanças rápidas em UI/UX.
- A experiência atual deve transmitir uma loja-base confiável e reutilizável, sem depender de narrativa ou identidade herdada.

## Rebrand Selo Libertária

- A experiência deve comunicar, já na primeira dobra, que se trata de uma livraria para adultos com proposta literária e cultural.
- O acervo visual real do selo deve aparecer cedo na navegação: mocks de livro sustentam confiança de catálogo, e ilustrações em preto e branco funcionam como extensão de atmosfera, nunca como decoração aleatória desconectada do conteúdo.
- No redesign `Editorial V2`, a experiência deve parecer mais curada e calma: menos ruído visual, mais hierarquia tipográfica, capas maiores e blocos com leitura em cadência de revista, sem esconder compra, busca, favoritos, carrinho ou admin.
- O calor da marca deve vir de curadoria, atmosfera, tipografia, imagem e ritmo, não de apelos gráficos óbvios.
- A pessoa usuária deve sentir ao mesmo tempo desejo de explorar e confiança para comprar.
- Conteúdo editorial, autora, livros, eventos e Sarau Safado precisam coexistir como partes do mesmo universo, e não como áreas desconectadas.

## Home do rebrand

- A home precisa responder rapidamente três perguntas:
  - o que é o Selo Libertária;
  - o que posso comprar ou explorar aqui;
  - por que esse universo é diferente.
- A experiência da home deve oscilar entre descoberta e conversão sem parecer uma colagem de páginas.
- Depois da primeira dobra, a pessoa usuária deve encontrar livros cedo o bastante para comprar sem esforço, mas também contexto suficiente para perceber valor cultural e autoria.
- A sequência ideal de entendimento é:
  - primeiro a proposta;
  - depois o catálogo;
  - depois a densidade cultural;
  - por fim o relacionamento contínuo com agenda, redes e contato.
- Em desktop, a experiência deve parecer uma capa editorial navegável; em mobile, uma narrativa curta e quente em camadas bem espaçadas.
- Na etapa atual guiada por Figma, a transição entre hero, manifesto e vitrine deve parecer mais suave e intencional, com reveals discretos que ajudem a leitura em vez de chamar atenção para a animação.
- O ritmo ideal alterna tensão e respiro: impacto, compra, contexto, prova cultural, intimidade e continuidade.
- A arquitetura da página deve refletir esse ritmo também no código: uma seção por intenção de experiência, evitando componentes gigantes com responsabilidades misturadas.
- Na sessão `Home Desktop` do Figma, a experiência esperada é mais direta e encadeada: entrar pela marca, reconhecer um livro protagonista, receber o manifesto, enxergar o destaque de compra, perceber o catálogo como prateleira curta e terminar no convite do `Sarau Safado` antes do footer. Se a home adicionar muitos blocos institucionais extras nesse percurso, a leitura perde força.

## Páginas institucionais do Selo Libertária

- Nessas páginas, a pessoa usuária deve entender rápido por que aquela área existe dentro do ecossistema do selo e como ela se conecta aos livros.
- A experiência não deve parecer uma sequência uniforme de cartões com mesmo peso visual; precisa haver entrada, aprofundamento e saída.
- Na etapa atual da Goal 3, a passagem entre hero, blocos curatoriais e continuidade deve ficar mais fluida nessas páginas, usando motion discreto para reforçar leitura e não para espetacularizar a navegação.
- No `Sarau Safado`, a primeira dobra deve se comportar como uma capa legível: a imagem de fundo atrai e contextualiza, enquanto o texto sobreposto precisa permanecer fácil de ler sem competir com a fotografia.
- Links de continuidade para catálogo, agenda, projetos, contato ou Sarau Safado devem aparecer de forma natural para evitar becos sem saída.
- No admin, a edição editorial precisa ser direta e pouco ansiosa: a pessoa deve entender rapidamente o que controla hero, texto principal, blocos curatoriais, imagem e publicação sem depender de conhecimento técnico.
- Para manutenção recorrente, a área editorial precisa dar senso de localização: hub inicial, links entre superfícies vizinhas e resumo de última atualização ajudam a reduzir retrabalho e dúvida operacional.
- Quando a página pública tem blocos com funções diferentes, como `about` e `contact`, a experiência de edição precisa preservar esse mapa mental no admin; a pessoa operadora deve reconhecer facilmente o que altera hero, texto institucional, canais diretos ou caminhos de navegação.
- Na home, a experiência de edição precisa respeitar a natureza híbrida da página: o admin deve conseguir ajustar a voz institucional sem a sensação de estar editando também o catálogo, os eventos ou os projetos, que possuem cadastros próprios.
- Em manutenção editorial cotidiana, mudar a ordem de uma agenda ou de uma lista de projetos deve ser uma ação rápida e local. Controles de subir/descer diminuem atrito e transmitem previsibilidade melhor do que exigir edição manual de números.
- Em uploads editoriais, a pessoa operadora não deve depender de um efeito implícito para saber se a imagem entrou. Selecionar, enxergar a prévia e salvar é uma sequência mais confiável e menos ansiosa para esse backoffice.
- Em uploads por arquivo no admin, abrir uma prévia em modal antes da confirmação reduz ansiedade operacional e evita salvar mídia errada; `Salvar` deve confirmar a escolha, e `Descartar` deve limpar a seleção sem efeitos colaterais.
- Em rotas de admin e login, qualquer splash global que bloqueie interação degrada a confiança do produto. Essas superfícies devem responder imediatamente a clique, digitação e seleção de arquivo.

## Login do Selo Libertária

- A experiência de login deve continuar funcional e imediata, mas com sensação de entrada em um universo editorial, não em uma tela técnica apartada do resto do site.
- A primeira leitura precisa comunicar três coisas sem esforço: onde a pessoa está, por que vale entrar e qual caminho principal seguir para autenticação.
- A presença de uma capa ou peça visual grande ao lado do formulário deve aumentar desejo e reconhecimento de marca sem competir com o submit.
- Recuperação de senha, login social e criação de conta precisam continuar acessíveis, mas subordinados claramente ao fluxo principal de entrar.
- No cadastro, a experiência deve reduzir desistência pedindo primeiro o mínimo necessário; endereço e preferências podem entrar em passos posteriores, desde que a progressão fique clara e calma.

## Footer da selolibertaria

- O crédito de desenvolvimento deve funcionar como informação secundária de confiança, não como CTA principal.
- Em telas menores, o conteúdo precisa quebrar de linha de forma natural sem apertar os ícones de pagamento nem prejudicar a leitura do copyright.
- Links externos no footer devem ser claros e previsíveis, preservando acessibilidade e consistência visual.

## Pós-checkout

- Depois de enviar o pagamento, a pessoa usuária precisa entender rapidamente se o sistema está apenas aguardando confirmação ou se o caso foi para análise.
- Se a confirmação não chegar em até `15s`, a experiência deve encerrar a sensação de espera infinita redirecionando automaticamente para a área de pedidos.
- Se a confirmação já estiver concluída no retorno do pagamento, a experiência não deve continuar girando por dependência de sincronização secundária.

## Entrega no checkout

- A pessoa usuária precisa entender cedo se o pedido vai para o endereço salvo, um endereço novo ou retirada na loja.
- A escolha não deve ficar escondida depois do pagamento, porque isso aumenta surpresa e retrabalho.
- Ao optar por retirada, a experiência deve deixar claro que o custo de frete de entrega some e que permanece um prazo de preparo.
- Ao optar por novo endereço, a pessoa deve perceber imediatamente que aquele endereço será o usado no pedido, com recálculo do frete em tempo real.

## Frete

- A pessoa usuária deve entender rapidamente o custo e o prazo do frete antes de pagar.
- Se o provedor falhar, a experiência precisa continuar estável e indicar uma nova tentativa sem quebrar o fluxo principal.
- A cotação escolhida deve permanecer previsível depois de aplicada, para não gerar surpresa entre carrinho, checkout e confirmação do pedido.

## Cards de produto

- A pessoa usuária deve conseguir favoritar ou adicionar ao carrinho diretamente da listagem, sem depender da PDP.
- O contorno do card deve ser reto para reforçar a linguagem visual da vitrine sem prejudicar legibilidade nem área clicável.
- A grade deve parecer estável e previsível: cards com o mesmo tamanho reduzem ruído visual, e a imagem precisa se ajustar dentro dessa moldura fixa.
- O nome do produto precisa ser legível de imediato na grade, sem exigir aproximação visual nem competir em desvantagem com o preço.
- A ação de compra rápida deve parecer leve e desejável: um controle compacto com `+` comunica velocidade sem cobrir demais a foto do produto, e o texto completo só aparece na expansão com uma transição fluida de pelo menos `1s`.
- A interação precisa funcionar com mouse, teclado e toque, então hover nunca pode ser o único caminho para a ação principal.
- Quando houver variantes, a pessoa usuária deve conseguir selecionar a opção no próprio card antes de adicionar ao carrinho, com feedback visual claro da opção ativa e leitura imediata do rótulo selecionado.

## Catálogo e PDP do Selo Libertária

- Antes de entrar na grade, a pessoa usuária deve receber um enquadramento curto que explique como ler aquele catálogo.
- Na fase concluída da Goal 3, busca e categoria deixam de parecer páginas técnicas isoladas e passam a reutilizar a mesma entrada curatorial do catálogo, mantendo continuidade emocional mesmo quando a pessoa chega por pesquisa.
- Na PDP, a compra vem primeiro, mas a página deve continuar convidando a circular entre livro, programação e contexto cultural.
- Na iteração atual da Goal 3, a PDP deve transmitir acabamento maior logo ao entrar: capa firme, título mais dramático, CTAs estáveis e bloco de citação/detalhes entrando com movimento mínimo e legível.
- Em estados sem resultado, a experiência deve continuar editorial e orientada: em vez de um vazio duro, a pessoa precisa receber contexto, saída rápida para o catálogo e continuidade para agenda ou descoberta cultural.

## Backoffice

- Perfis internos como `admin` e `vendor` devem ter uma experiência operacional enxuta, vendo somente módulos compatíveis com sua responsabilidade.
- Quando uma ação não for permitida, o sistema deve falhar de forma clara e previsível, sem levar a pessoa usuária interna a descobrir a restrição apenas no fim do fluxo.
- No dashboard do admin, a pessoa operadora deve conseguir identificar em poucos segundos o que vendeu, o que está travado no pagamento e o que ainda precisa avançar em fulfillment.
- O painel inicial do backoffice deve favorecer ação e diagnóstico: alertas operacionais precisam aparecer antes de análises secundárias ou listas longas.
- No novo estilo editorial do admin, a experiência precisa transmitir orientação imediata: hero curto para contextualizar a tela, métricas logo abaixo para leitura rápida e só depois tabelas ou formulários extensos.
- Na implementação atual guiada por Figma, a navegação do admin deve passar sensação de “caderno editorial”: a pessoa entra, encontra uma sidebar estável com poucos sinais visuais e percebe o item atual pelo pill claro e pelo ponto de estado, sem competir com o conteúdo.
- Na fase atual da Goal 2, migrar páginas administrativas legadas para esse mesmo enquadramento reduz ansiedade operacional: a pessoa entende o contexto da tela antes de mergulhar em grids densos de email, webhook ou usuários.
- Na mesma fase, bibliotecas de revisão e taxonomia do backoffice devem oferecer leitura em duas etapas: primeiro contexto e escolha, depois preview ou tabela principal. Isso vale especialmente para templates de email, categorias de produto e coleções editoriais.
- Na Goal 4, a experiência do admin deve parecer linguisticamente estável: trocar de tela não pode significar trocar acidentalmente de idioma, porque isso quebra confiança e aumenta a sensação de produto incompleto.
- Na passada atual da Goal 4, telas de configuração e promoção devem reduzir a sensação de “produto pela metade”: salvar provedores, idioma, suporte ou campanhas precisa devolver feedback em `pt-BR` claro e apresentar labels previsíveis, sem alternar entre termos técnicos em inglês e operação cotidiana em português.
- Em categorias e formulários de produto, a pessoa operadora não deve precisar traduzir mentalmente termos de origem do sistema; rótulos como `Catálogo` e `Manual` reduzem ambiguidade melhor do que valores crus de implementação.
- Em promoções, a pessoa operadora também não deve desconfiar da moeda aplicada ao ler um resumo ou regra; se o sistema trabalha com uma moeda única do ambiente nesta fase, o texto e a formatação visual precisam refletir isso em toda a tela, inclusive nos fallbacks.
- Em `admin/email-templates`, a pessoa operadora deve entender rapidamente qual grupo de mensagem está revisando, ver o email de suporte vigente sem espera extra e receber um estado vazio honesto quando a busca não retornar nenhum template, em vez de continuar vendo uma prévia que já não corresponde ao filtro.
- Em auditorias como `webhooks` e `emails`, nomes de coluna e ações de detalhe devem ajudar leitura rápida antes de exigir conhecimento técnico. A pessoa operadora entende melhor `ID do evento` e `Abrir detalhes` do que termos crus em inglês quando o contexto já é conhecido.
- Quando a pessoa abre uma prévia ou modal no admin, a experiência não deve “trocar de idioma” nos detalhes menores. Labels como `ID da mensagem` e `Imagem do produto` também fazem parte da sensação de acabamento da Goal 4.
- O mesmo vale para estados compartilhados: ver `Pago`, `Em processamento` ou `Cancelado` diretamente no badge reduz carga cognitiva melhor do que ler um valor técnico cru e traduzi-lo mentalmente em cada tabela.
- Essa previsibilidade também precisa alcançar os filtros compartilhados: selecionar `Período`, `Ordenação` e status em `pt-BR` reduz microtraduções mentais recorrentes no dashboard e em pedidos.
- No painel inicial do admin, a pessoa operadora não deve precisar conhecer o jargão interno da implementação; termos como `expedição`, `recebimento de eventos`, `prévia da loja` e `código de rastreio` tornam a leitura mais direta do que `fulfillment`, `ingest`, `storefront` e `tracking`.
- Em detalhes de pedido, essa clareza precisa continuar até a ação: `Salvar expedição` e `Status de expedição` reduzem hesitação melhor do que manter o vocabulário interno da implementação na interface.
- Em formulários editoriais, autoformatar o slug enquanto a pessoa digita reduz erro bobo de publicação e evita que ela precise “limpar” manualmente espaços, acentos e caracteres inválidos antes de salvar.
- No fluxo editorial, a pessoa operadora entende melhor `área pública` ou `site` do que `storefront`; esse tipo de ajuste pequeno diminui a sensação de produto híbrido ou inacabado entre telas vizinhas.
- Em `settings`, a experiência também melhora quando o sistema corrige pequenos deslizes sozinho: email de suporte sem espaços sobrando, código de provedor coerente, endpoints previsíveis e países/CEPs já normalizados diminuem retrabalho antes do save.
- No seletor regional, abrir com um locale coerente desde o primeiro paint reduz a sensação de configuração arbitrária ou quebrada; a confirmação posterior pelos settings deve apenas reforçar esse estado, não contradizê-lo.
- Quando o bloco de frete fala `Chave da API` e `CEP de origem` em vez de labels legadas em inglês, a pessoa operadora precisa traduzir menos o formulário e consegue revisar a configuração com mais confiança.
- No OAuth, o mesmo acabamento reduz hesitação: ler `ID do cliente` e `Segredo do cliente` em vez de labels híbridas em inglês, com trim automático e sem autocorreção, deixa a configuração mais previsível.
- Em promoções, saber que o sistema aceita vírgula ou quebra de linha e que vai normalizar slugs/códigos ao salvar reduz medo de preencher “do jeito errado” campos operacionais mais secos.
- Em seletores de ambiente, `Teste` comunica intenção mais rapidamente para a operação cotidiana do que `Sandbox`.
- Em listagens e formulários de permissão, `Administrador` e `Vendedores` reduzem a sensação de interface remendada melhor do que labels híbridas como `Admin` ou `Vendors`.
- Na navegação lateral, ver `Painel` e `Modelos de email` em vez de resíduos em inglês ajuda a pessoa operadora a perceber o admin como um sistema coeso, não como uma soma de telas migradas aos poucos.
- O mesmo vale para o selo persistente do shell: `painel editorial` comunica um produto acabado melhor do que `admin editorial`, que soa como rótulo interno vazado.
- Em `admin/settings`, a pessoa operadora não deve precisar percorrer todos os formulários só para achar um ajuste específico; seções recolhíveis com contexto curto ajudam a entrar no bloco certo mais rápido e reduzem fadiga durante tarefas repetitivas.
- Se a tela inteira está em `pt-BR`, ver opções de idioma nomeadas em inglês dentro do próprio seletor regional cria ruído desnecessário; a pessoa operadora deve ler essas escolhas no mesmo idioma da interface atual.
- Na Goal 6, a pessoa operadora deve sentir que a navegação lateral é o mesmo sistema em desktop e mobile; abrir o sheet no celular ou olhar a sidebar no desktop não pode parecer trocar de produto.
- Na Goal 6, localização e orientação precisam acontecer sem esforço: item ativo, grupo atual, sessão e ações de saída devem manter a pessoa situada mesmo ao alternar entre dashboard, catálogo, editorial e operação.
- Se o shell administrativo produzir sobreposição tipográfica, áreas vazias grandes ou hierarquia fraca nos menus, a experiência deve ser tratada como quebrada, porque isso reduz confiança antes mesmo da pessoa começar a operar.
- Em detalhes de usuário, a pessoa administradora deve ler primeiro o estado da conta, o papel e o volume de compras antes de encontrar ações sensíveis como bloquear ou alterar permissões.
- O cockpit do dashboard deve responder primeiro “o que precisa da minha atenção hoje?” e só depois abrir a camada analítica mais profunda; por isso a fila operacional e o resumo de atividade vêm antes das seções extensas de tabela e chart.
- O preview lateral do dashboard não substitui staging nem publicação, mas reduz ansiedade operacional ao lembrar a pessoa de verificar storefront e narrativa antes de publicar ou seguir alterando blocos.
- Na gestão de usuários, a pessoa administradora deve entender rapidamente quem está ativo, bloqueado ou com privilégio elevado, e mudanças sensíveis como bloquear acesso devem comunicar impacto imediato sobre sessões ativas.
- Em catálogo, tanto `admin` quanto `vendor` devem conseguir editar produto sem ambiguidade de permissão, e o histórico precisa permitir reconstruir rapidamente o que mudou e quem fez a alteração.
- No cadastro e na edição de produto, a pessoa operadora deve entender rapidamente o que é dado compartilhado do produto, o que é específico da variante e o que controla disponibilidade.
- Variantes precisam parecer itens secundários, porém acessíveis: a visão resumida deve apoiar comparação rápida, e a edição detalhada deve abrir em modal focado para reduzir carga cognitiva.
- O estado de ativação não deve exigir conhecimento técnico da Stripe; a interface precisa comunicar apenas o impacto operacional de ativar ou desativar o item.
- Em pedidos, a pessoa operadora deve conseguir alterar fulfillment sabendo que toda mudança ficará auditável; o histórico precisa reduzir dúvida sobre quem mudou status ou rastreio e quando isso aconteceu.
- O feedback após salvar fulfillment deve ser imediato: a própria tela precisa refletir o novo registro de auditoria sem exigir refresh manual.
- Na leitura de detalhes do pedido, resumo, fulfillment e auditoria devem aparecer como uma sequência curta e previsível, com linguagem operacional em `pt-BR` e microtransições discretas que reforçam orientação sem atrasar a ação.
- O id de pedido exibido para operação e suporte deve ser estável e interno ao produto, para que a equipe não dependa de ids técnicos da Stripe como referência principal do pedido.
- Quando um webhook alterar automaticamente o status de pagamento, a pessoa operadora também deve enxergar esse momento no histórico do pedido com data, hora e origem automática claramente identificadas.
- Em frete, a pessoa operadora precisa conseguir entender rapidamente qual provedor está ativo, qual serviço foi cotado e se a integração está saudável antes de mexer em regras ou credenciais.
- Em settings de frete, a pessoa operadora não deve precisar lembrar o formato de autenticação de cada API; o formulário deve guiar a configuração de Correios, Jadlog e EasyPost com campos já organizados por padrão.
- No shell do backoffice, a sidebar fixa deve ajudar na sensação de localização contínua entre módulos; ao trocar de página, a pessoa operadora deve perceber que continua dentro do mesmo “caderno” editorial, não em telas desconectadas.
- Em formulários administrativos, autoformatação deve diminuir fricção sem gerar surpresa: a pessoa precisa sentir que o sistema ajuda a preencher melhor, não que está brigando com o input ou alterando dados sem transparência.
- Essa previsibilidade precisa continuar na edição de livros: se o `slug` já se autoformata na criação, a mesma regra deve valer ao editar, para não obrigar a pessoa operadora a reaprender o campo no meio da manutenção.
- Em promoções, reduzir a largura dos campos curtos melhora escaneabilidade e transmite intenção mais rápido: a pessoa operadora identifica de imediato o que é código, número, data ou valor sem percorrer uma faixa longa de input vazio.
- Em prévias de email, a confiança também depende do exemplo parecer real para aquele ambiente; quando a moeda do mock acompanha o `env`, a revisão transmite menos sensação de painel provisório.
- Em `settings`, limitar a largura de email de suporte e credenciais OAuth reduz a fadiga visual em uma tela já segmentada por blocos. O formulário passa a parecer calibrado para revisão cuidadosa, não uma planilha esticada.
- Em categorias, a mesma proporção melhora a tarefa de manutenção rápida: criar ou renomear um nome curto em um campo muito longo aumenta ruído visual e faz a ação parecer mais pesada do que realmente é.
- Em aparência, uma ajuda curta antes do seletor de tema reduz ambiguidade e evita que a pessoa operadora trate o ajuste como algo mais amplo do que ele realmente é. Um controle compacto reforça que se trata de uma escolha simples e reversível.
- Em catálogo, um fallback silencioso para `BRL` em um painel de variantes quebra confiança do mesmo jeito que um label em inglês. Se a moeda ainda não veio do item, a pessoa operadora deve ver a moeda do ambiente, não uma suposição escondida.
- O mesmo cuidado vale para microcopy curta: ler `backoffice` isolado em uma tela já toda organizada como `admin` reintroduz a sensação de sistema remendado. Uniformizar até essas frases pequenas melhora a percepção de acabamento.
- O mesmo vale para pills de status: `OK` é curto, mas pouco característico. `Em dia` comunica melhor a saúde operacional e reforça que o dashboard inteiro fala a mesma língua.
- Em hubs de navegação, CTA genérica também gera atrito. Quando cada card nomeia a próxima ação com precisão, a pessoa operadora decide mais rápido para onde ir e sente menos ambiguidade na entrada do fluxo editorial.
- Em hubs editoriais, consistência entre CTAs equivalentes também importa, mas com gramática natural: repetir construções como `Editar página de contato` e `Editar página do Sarau Safado` reduz a sensação de exceção ou regra quebrada.
- Quando a pessoa entra na tela de edição, essa mesma regra deve continuar. Manter essas construções também no título interno evita a sensação de que a navegação e o formulário falam de objetos diferentes.
- Em tabelas densas, `Abrir` também é vago demais. Um CTA como `Ver pedido` reduz a microdecisão na leitura da linha e acelera a revisão operacional.
- No cockpit do admin, CTA curta demais também pesa: `Ver pedidos` e `Ir para editorial` deixam claro se a ação é navegação, inspeção ou continuidade de trabalho, reduzindo hesitação em áreas de decisão rápida.
- O mesmo cuidado vale para o vocabulário do domínio: quando a operação enxerga `livro` e `loja` em vez de termos genéricos como `produto` ou `Pré-visualizar`, a leitura fica mais imediata e menos parecida com um starter ainda não adaptado.
- Em superfícies de auditoria, texto demais também vira ruído. Quando um helper passa a dizer `Sem disparar emails reais` ou `Assinatura sem validação`, a pessoa entende mais rápido o risco e a utilidade daquele bloco do que com frases vagas ou meramente descritivas.
- Em settings e telas de criação, esse mesmo cuidado melhora onboarding instantâneo: uma nota `Como usar` e placeholders como `ID informado pelo provedor` ajudam sem parecer documentação crua despejada dentro do formulário.
- Em valores monetários, a previsibilidade depende do exemplo certo. Mostrar `19,90` na copy visível e explicar `2500 para 25,00` quando a unidade interna ainda é centavos reduz erro sem esconder como o sistema funciona.
- Em telas de detalhe, a mesma regra melhora velocidade de leitura: títulos curtos e helpers concretos reduzem fadiga melhor do que descrições que parecem narrar a própria tela.
- Em páginas editoriais, a pessoa operadora também decide melhor com textos curtos e concretos. Quando a copy fala em `site`, `página` e `calendário`, a leitura fica mais leve do que com fórmulas abstratas sobre contexto editorial.
- Em painéis e logs, trocar termos mais burocráticos por palavras comuns acelera triagem. `Nova tentativa` e `envios recentes` exigem menos tradução mental do que verbos ou rótulos mais técnicos.
- Em formulários compartilhados, reduzir o tamanho mental da instrução também acelera preenchimento. Quando a tela fala em `site`, `lista` e `revisar a imagem`, a pessoa entende o próximo passo sem precisar decodificar o fluxo do sistema.
- Em `settings`, auditoria e previews, reduzir o peso lexical também diminui ansiedade operacional: `reserva`, `registro`, `assinatura` e `filtro atual` são mais rápidos de entender do que `fallback`, `evento auditável`, `assinatura operacional` ou `recorte atual` quando a pessoa só quer conferir e seguir.
- Em detalhes de usuário, labels mais próximas da ação também reduzem hesitação. `Ações sensíveis` informa mais rápido o que está em jogo do que um resumo abstrato como `Gestão interna`.
- Em conta e checkout, a experiência também perde confiança quando um erro fala da configuração interna do servidor ou quando o CTA de retorno aponta para uma `Home` abstrata. Mensagens como `Pagamento indisponível no momento` e `Voltar para a loja` ajudam a pessoa a entender o próximo passo sem esbarrar na implementação.
- Do lado do time, a experiência de manutenção também importa: arquivos duplicados de locale com copy antiga aumentam ruído e facilitam regressão. Limpar esses órfãos reduz dúvida sobre qual mensagem realmente governa a interface.
- Para a pessoa usuária, a mesma regra vale em erros de perfil e pagamentos salvos: mesmo que a API devolva texto técnico ou em outro idioma, o client deve traduzir a falha para a linguagem da tela antes de exibi-la.
- Em interações rápidas como favoritar um item, esse cuidado vale até para o que não aparece visualmente o tempo todo: `aria-label` coerente com o locale e payload de erro estável reduzem ruído tanto para acessibilidade quanto para futuras melhorias de feedback.
- Em recuperação de acesso e cadastro, esse mesmo cuidado reduz ansiedade: a pessoa não deve ver um erro cru da API nem uma tela parcialmente traduzida justamente num fluxo sensível como redefinir senha ou concluir uma conta social.
- Mesmo quando o erro ainda não aparece diretamente na tela, contratos estáveis ajudam a experiência futura: códigos claros em CEP, carrinho e verificação de email evitam que uma próxima mudança reintroduza texto técnico ou idioma errado por acidente.
- Quando o erro aparece, o tom também pesa: mensagens públicas mais humanas e menos secas reduzem atrito emocional em newsletter, recuperação de senha, cadastro, perfil e pagamento salvo.
- Em verificação de conta, consistência também significa previsibilidade: pedir novo email de confirmação e receber exatamente a mesma linguagem da tela transmite mais confiança do que ver uma frase diferente vinda do backend.
- Em sanfonas de configuração, `Expandir` e `Recolher` reduzem ambiguidade cognitiva melhor do que `Abrir` e `Fechar`, porque descrevem exatamente o efeito sobre a seção.
- Em ações curtas de apoio, explicitar o objeto da ação reduz microhesitação: `Salvar email` ou `Ver detalhes` deixam a interface mais previsível do que um verbo isolado que depende de leitura extra do entorno.
- No catálogo, a mesma clareza reduz revisão mental desnecessária: `Salvar livro` e `Salvar nome` confirmam o escopo da ação sem obrigar a pessoa operadora a reler o bloco inteiro antes de clicar.
- Em revisão de imagem, um rótulo como `Fechar prévia` também reduz microhesitação: a pessoa entende imediatamente que vai sair da inspeção ampliada, não cancelar outra etapa do formulário.
- Em saves de páginas editoriais e de frete, explicitar o alvo reduz releitura desnecessária: a pessoa confirma mais rápido se está salvando a página certa ou a configuração operacional correta.
- Em promoções e listas editoriais, a mesma precisão reduz microhesitação: a pessoa entende o alvo da ação antes do clique, sem depender do contexto da linha ou do card para completar mentalmente o verbo.
- No catálogo, esse ganho é igual: `Editar livro` e `Editar variante` reduzem releitura e ajudam a distinguir rapidamente entre manutenção do grupo e manutenção da variante.
- Em configurações administrativas da Goal 4, remover escolha de moeda reduz ruído mental: se o sistema ainda opera com uma única moeda vinda do ambiente, a experiência deve refletir essa regra com clareza e deixar conversão futura fora da interface por enquanto.
- Mesmo pistas secundárias, como cards-resumo de `settings`, não devem reintroduzir esse tema. Quando a pessoa abre a tela para ajustar idioma ou país, ler `Moeda` de novo sugere uma configuração que já não existe.
- A experiência de login também precisa seguir o idioma resolvido pela aplicação; abrir a tela e encontrar hero em português com CTA, placeholder ou links em inglês quebra confiança logo na entrada do produto.
- Em `email-templates`, pequenos resíduos como `Templates` no eyebrow também afetam percepção de acabamento; quando a pessoa revisa comunicação transacional, a própria moldura da tela precisa parecer finalizada.
- Em `users`, ler papéis crus como `admin` ou `customer` quebra a sensação de produto final do mesmo jeito; a pessoa operadora deve encontrar nomenclatura administrativa estável também nas tabelas de gestão de acesso.
- O mesmo cuidado vale para o editorial: quando a pessoa alterna entre projetos e edição da página inicial, a experiência deve manter o mesmo idioma e a mesma lógica operacional, sem ressurgir `Home` ou `backoffice` como sobras do starter.
- No hub editorial, a consistência de nomenclatura também ajuda orientação: ver `Página inicial` no card e no formulário evita a sensação de que cada tela fala de uma entidade diferente.
- Em previews de email, ver links e itens de exemplo ligados ao contexto do Selo Libertária reduz estranhamento e aumenta confiança na revisão, mesmo quando a tela está exibindo dados fictícios.
- No catálogo do admin, a pessoa operadora não deve precisar reinterpretar preços ou ignorar ids internos: moeda formatada no padrão local, histórico traduzido e cartões de variante mais limpos reduzem ruído e tornam a leitura mais confiável.
- No fluxo de autenticação, a experiência também quebra quando microtextos de apoio ignoram o locale atual; etapas do cadastro, divisores sociais e CTAs intermediárias precisam mudar junto com o restante do login para não parecer uma tela parcialmente traduzida.
- O mesmo vale para acessibilidade e navegação assistiva: se um modal ou menu anuncia `Close` em inglês no meio de uma interface em `pt-BR`, a sensação de acabamento cai também para quem usa leitor de tela ou inspeção por acessibilidade.
- Quando a shell compartilhada ignora o locale ativo, a sensação de produto fragmentado reaparece em todas as rotas ao mesmo tempo; traduzir `Abrir menu`, `Voltar ao site`, `Sessão` e o CTA de conta reduz esse ruído estrutural antes mesmo de a pessoa começar a operar a tela.
- Mesmo fora do admin estrito, pequenos vazamentos como um `Browse products` isolado, um fallback de erro em inglês ou um `TODO` visível na conta quebram a confiança do mesmo jeito; fechar esses pontos rápidos melhora a sensação de acabamento sem exigir redesign.
- Quando o dashboard mostra uma moeda em um formato e o gráfico responde em outro, a pessoa operadora perde confiança nos números mesmo sem erro de cálculo. Na Goal 4, leitura analítica e leitura operacional precisam compartilhar o mesmo locale resolvido do admin.
- Em auditoria operacional, a mesma confiança depende de detalhes menores: abrir um email ou webhook e encontrar datas, labels e estados no mesmo idioma da listagem reduz a sensação de ferramenta remendada e acelera a revisão.
- O mesmo vale para microfluxos de suporte e mídia: um erro de upload em inglês ou uma confirmação de exclusão falando em `storage` quebra a sensação de acabamento exatamente na hora em que a pessoa está tentando salvar ou revisar algo delicado.
- Em telas de preview, essa sensação de acabamento depende muito do vocabulário: quando busca, seletor, botão de recarga e empty state falam a mesma língua da moldura editorial, a revisão de emails ou imagens parece parte do produto final e não um painel provisório.
- O mesmo cuidado precisa aparecer em mensagens de erro e detalhes técnicos: se a pessoa tenta salvar expedição ou abrir um webhook, a experiência não deve quebrar com `Failed`, `Headers` ou `Payload`, porque isso devolve imediatamente a sensação de ferramenta inacabada.
- Quando até a legenda do gráfico e o erro de catálogo falam a língua da operação, a pessoa administradora sente mais consistência e confiança. Pequenos vazamentos em analytics ou validação têm impacto desproporcional porque aparecem justamente em momentos de decisão.
- O mesmo tipo de incoerência aparece em hubs editoriais quase iguais: quando eventos e projetos mostram datas com regras diferentes, a pessoa percebe drift mesmo sem saber apontar o motivo. Padronizar isso reduz a sensação de migração incompleta.
- Essa percepção de drift também aparece em detalhes individuais: se um card meta editorial, um perfil de usuário ou uma promoção exibem data em outro padrão, a pessoa entende que cada tela foi montada com regras próprias. Uniformizar isso reforça a sensação de sistema único.
- O mesmo raciocínio vale para autenticação e perfil: mesmo quando o erro não aparece inteiro na tela, `code` estável e respostas sem resíduos híbridos preservam a liberdade de refinar a experiência depois sem herdar mensagens tortas do backend.
- A mesma lógica vale para o backoffice operacional: se upload, exclusão, reenvio de email ou expedição responderem com `No changes`, `Invalid status` ou instruções em inglês, a sensação de produto inacabado volta imediatamente; por isso essas rotas também precisam falar a língua do admin e manter `code` estável.
- O mesmo raciocínio vale para frete: esconder o seletor de moeda na UI, mas continuar aceitando `currency` por provedor no contrato, mantém uma regra duplicada invisível. Remover esse resíduo deixa a experiência mais previsível para quem configura e para quem lê o resultado.
- A mesma coerência vale para estados de frete: quando faltam provedores ou a pessoa escolhe retirada, os rótulos automáticos também precisam falar a língua da operação. Deixar `Store pickup` ou `Provider 1` nesses momentos quebra a sensação de acabamento exatamente no fallback.
- O mesmo princípio vale para ações sensíveis de administração: receber `You cannot change your own role` ou texto bruto de uma rota ao salvar expedição interrompe a confiança da operação. Nessas telas, a mensagem precisa ser direta, local e previsível.
- O mesmo vale para leitura passiva de usuário: se a tela mostra `ADMIN` ou `paid` cru, a sensação de migração incompleta volta mesmo sem erro. A operação precisa reconhecer o papel e a compra sem traduzir mentalmente o domínio interno.
- Em formulários de frete, headings curtos e estados bem rotulados também reduzem atrito: quando a seção já é longa, termos mais concretos ajudam a decidir mais rápido onde editar.
- No módulo de e-mails, a mesma consistência reduz ruído cognitivo: grafia estável de `E-mail`, estados mais naturais e preview com `Versão em texto` deixam a triagem e a revisão mais confiáveis.
- O mesmo vale para webhooks: quando a pessoa está monitorando integrações, `Recebimento de webhooks` e `Com falha` facilitam leitura e priorização mais do que uma nomenclatura mais fria ou excessivamente técnica.
- A mesma coerência se aplica à grafia de `e-mail`: quando sidebar, título e preview alternam entre formas diferentes, a sensação de acabamento cai mesmo sem erro funcional.
- O mesmo acontece em dashboard e promoções: ler `Emails`, `email` e `e-mail` no mesmo fluxo, ou encontrar um card relembrando moeda onde isso já não é escolha da operação, aumenta a sensação de remendo e desvia a atenção do que realmente precisa ser decidido.
- O mesmo vale para a entrada da área de comunicação: quando a sidebar diz `E-mails` e a hero responde `Emails`, a pessoa percebe uma inconsistência antes mesmo de começar a revisar conteúdo.
- Esse ruído reaparece também em suporte e auditoria: ver `Email de suporte`, `Nenhum email encontrado` ou uma seção de frete ainda falando em `moeda` faz a operação parecer parcialmente limpa. Quando a pessoa chega nesses pontos, ela já espera uma interface coesa e sem explicações que reabram decisões encerradas.
- Em listagens, o efeito é ainda mais imediato: alternar entre `Email`, `E-mail`, `Falhos` e `Com falha` em páginas vizinhas faz o admin parecer montado por partes. Uniformizar esses rótulos reduz atrito cognitivo sem exigir redesign.
- Em ações destrutivas, a ambiguidade pesa mais: um `Arquivar` solto obriga a pessoa a confirmar mentalmente o alvo antes de clicar. Tornar o CTA explícito reduz hesitação e erro operacional sem mudar o fluxo.
- Em mídia, o ruído vem do jargão: quando a tela fala em `Upload` ou em reaproveitar fluxo de produto, a pessoa sai do contexto editorial e volta a pensar na ferramenta. `Imagem` e descrições mais diretas deixam a tarefa mais natural.
- Em telas de inspeção, acontece o mesmo: `Evento bruto`, `Cliente` genérico ou um `Salvo` seco demais exigem mais interpretação do que o necessário. Deixar o rótulo mais explícito reduz esforço justamente nos fluxos de conferência.
- Em painéis de confiabilidade, `webhook` repetido o tempo todo também pesa. Quando a interface troca isso por `recebimento` ou `evento recebido`, a leitura fica mais operacional e menos presa ao termo técnico do pipeline.
- O mesmo vale para detalhes e listas: `Cliente` ou `Modelo` exigem um passo mental a mais, enquanto `E-mail do cliente` e `Tipo da mensagem` deixam a revisão mais direta no ritmo do trabalho.
- Quando até a origem da categoria e o CTA do painel falam de forma direta, a pessoa precisa interpretar menos. `Catálogo integrado`, `Criada no admin` e `Ver recebimento` encurtam esse esforço de leitura.
- Em componentes repetidos, o ganho se multiplica: trocar `Exige ação`, `Falhou` ou `Indefinido` por rótulos mais naturais reduz atrito em várias telas ao mesmo tempo, sem exigir reaprendizado da interface.
- Na navegação, esse efeito é ainda mais sensível: quando o menu chama uma área de `Webhooks`, mas a própria tela já opera como `Recebimento`, a pessoa sente uma quebra antes mesmo de começar a tarefa.
- Mesmo fallbacks pequenos importam: quando um select ou badge volta a `Indefinido` ou `Sem tipo definido`, a sensação de limpeza quebra de novo. Fechar esses cantos preserva a coerência percebida.
- O mesmo vale para a moldura fixa da área administrativa: quando a sidebar e a barra mobile falam só em `painel editorial` ou `sessão`, a orientação fica mais genérica do que precisa. Rótulos como `Navegação`, `Conta atual` e `Voltar para a loja` reduzem atrito logo na entrada de qualquer rota.
- Na home pública, misturar navegação em inglês com blocos mockados em português quebra a confiança logo na primeira dobra. Quando o locale ativo não for `pt-BR`, é melhor cair nas mensagens traduzidas da aplicação do que manter conteúdo editorial provisório em outro idioma.
- O mesmo vale para a pré-carga: se um splash pode ficar preso cobrindo o hero, a pessoa usuária interpreta a tela como quebrada antes mesmo de ler a proposta do site. A animação precisa ter um caminho de saída garantido mesmo quando a hidratação atrasa ou falha.
- O mesmo acontece com preço: quando o admin pede valor monetário, mas o campo responde melhor a `19.90` do que a `19,90`, a pessoa sente uma fricção desnecessária em um dos fluxos mais recorrentes do catálogo. Aceitar vírgula e manter o valor legível no padrão local reduz erro e hesitação.
- Em revisão de imagem, termos como `armazenamento configurado` quebram a naturalidade da tarefa porque puxam a atenção para a infraestrutura. Falar em `biblioteca de mídia` mantém a pessoa no contexto da operação, não da implementação.
- O mesmo vale para o hub editorial: quando a entrada da área mostra `item(ns)` ou ações genéricas demais, a pessoa percebe a interface como provisória antes mesmo de começar a editar conteúdo. Resumos naturais e CTAs específicos deixam a navegação mais confiante.
- Na inspeção de e-mails, o efeito é parecido: uma lateral com `canal usado` ou `tentativas` soltas pede mais interpretação do que o necessário. Nomear melhor esses blocos reduz o esforço de leitura em um fluxo que já é denso por natureza.
- O mesmo acontece em auditoria: ver `Sistema` ou `system` no meio de uma trilha de ações quebra a sensação de acabamento e obriga a pessoa a interpretar a origem técnica do evento. `Atualização automática` e `Automação` resolvem isso com menos esforço mental.
- Em blocos pequenos de detalhe, labels genéricas como `Origem` ou `Não definido` pedem contexto extra da pessoa operadora. Torná-las mais específicas reduz microdúvidas acumuladas ao longo da revisão.
- O mesmo vale para cards de promoção e painéis de modelo: quando a interface responde com `Sem data` ou `Não definido`, ela parece inacabada mesmo sem erro funcional. Fallbacks mais humanos e contextualizados sustentam melhor a sensação de produto final.
- Isso também aparece nos cantos menores: um `Sem assunto` ou `Sem descrição` em telas já contextualizadas soa mais duro do que o necessário. Trocar por fallbacks que expliquem o contexto reduz atrito de leitura sem alongar a interface.
- O mesmo acontece com estados curtos demais em galeria e recebimento: `Sem imagem`, `Sem código` ou `Assinatura válida` resolvem tecnicamente, mas comunicam menos do que versões ligeiramente mais contextuais. Esse refinamento reduz interpretação desnecessária nos fluxos mais repetidos.
- O mesmo se aplica aos vazios de catálogo: quando uma tabela responde com `—` ou uma ausência seca, a pessoa precisa inferir demais. Um vazio curto, mas explícito, preserva ritmo de revisão sem parecer dado quebrado.
- O mesmo vale para detalhes recorrentes de pedido, usuário e editorial: ver `—` em campos importantes obriga a pessoa a interpretar se houve falha, ausência real ou dado omitido. Trocar isso por fallbacks contextuais reduz microdúvidas acumuladas ao longo da operação.
