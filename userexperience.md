# User Experience

## Fonte canônica

- O documento principal de experiência continua sendo `UI_UX_PATTERNS.md`.
- O inventário funcional que deve orientar briefings de UI/UX fica em `spec.md`.
- Este arquivo destaca intenções de uso e comportamento para mudanças rápidas em UI/UX.
- A experiência atual deve transmitir uma loja-base confiável e reutilizável, sem depender de narrativa ou identidade herdada.

## Rebrand Selo Libertária

- A experiência deve comunicar, já na primeira dobra, que se trata de uma livraria para adultos com proposta literária e cultural.
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
- Em configurações administrativas da Goal 4, remover escolha de moeda reduz ruído mental: se o sistema ainda opera com uma única moeda vinda do ambiente, a experiência deve refletir essa regra com clareza e deixar conversão futura fora da interface por enquanto.
- Mesmo pistas secundárias, como cards-resumo de `settings`, não devem reintroduzir esse tema. Quando a pessoa abre a tela para ajustar idioma ou país, ler `Moeda` de novo sugere uma configuração que já não existe.
- A experiência de login também precisa seguir o idioma resolvido pela aplicação; abrir a tela e encontrar hero em português com CTA, placeholder ou links em inglês quebra confiança logo na entrada do produto.
- Em `email-templates`, pequenos resíduos como `Templates` no eyebrow também afetam percepção de acabamento; quando a pessoa revisa comunicação transacional, a própria moldura da tela precisa parecer finalizada.
- Em `users`, ler papéis crus como `admin` ou `customer` quebra a sensação de produto final do mesmo jeito; a pessoa operadora deve encontrar nomenclatura administrativa estável também nas tabelas de gestão de acesso.
- O mesmo cuidado vale para o editorial: quando a pessoa alterna entre projetos e edição da página inicial, a experiência deve manter o mesmo idioma e a mesma lógica operacional, sem ressurgir `Home` ou `backoffice` como sobras do starter.
- No hub editorial, a consistência de nomenclatura também ajuda orientação: ver `Página inicial` no card e no formulário evita a sensação de que cada tela fala de uma entidade diferente.
