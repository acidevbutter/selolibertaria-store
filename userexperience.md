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
- O ritmo ideal alterna tensão e respiro: impacto, compra, contexto, prova cultural, intimidade e continuidade.
- A arquitetura da página deve refletir esse ritmo também no código: uma seção por intenção de experiência, evitando componentes gigantes com responsabilidades misturadas.

## Páginas institucionais do Selo Libertária

- Nessas páginas, a pessoa usuária deve entender rápido por que aquela área existe dentro do ecossistema do selo e como ela se conecta aos livros.
- A experiência não deve parecer uma sequência uniforme de cartões com mesmo peso visual; precisa haver entrada, aprofundamento e saída.
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

## Footer da storefront

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
- Na PDP, a compra vem primeiro, mas a página deve continuar convidando a circular entre livro, programação e contexto cultural.

## Backoffice

- Perfis internos como `admin` e `vendor` devem ter uma experiência operacional enxuta, vendo somente módulos compatíveis com sua responsabilidade.
- Quando uma ação não for permitida, o sistema deve falhar de forma clara e previsível, sem levar a pessoa usuária interna a descobrir a restrição apenas no fim do fluxo.
- No dashboard do admin, a pessoa operadora deve conseguir identificar em poucos segundos o que vendeu, o que está travado no pagamento e o que ainda precisa avançar em fulfillment.
- O painel inicial do backoffice deve favorecer ação e diagnóstico: alertas operacionais precisam aparecer antes de análises secundárias ou listas longas.
- Na gestão de usuários, a pessoa administradora deve entender rapidamente quem está ativo, bloqueado ou com privilégio elevado, e mudanças sensíveis como bloquear acesso devem comunicar impacto imediato sobre sessões ativas.
- Em catálogo, tanto `admin` quanto `vendor` devem conseguir editar produto sem ambiguidade de permissão, e o histórico precisa permitir reconstruir rapidamente o que mudou e quem fez a alteração.
- No cadastro e na edição de produto, a pessoa operadora deve entender rapidamente o que é dado compartilhado do produto, o que é específico da variante e o que controla disponibilidade.
- Variantes precisam parecer itens secundários, porém acessíveis: a visão resumida deve apoiar comparação rápida, e a edição detalhada deve abrir em modal focado para reduzir carga cognitiva.
- O estado de ativação não deve exigir conhecimento técnico da Stripe; a interface precisa comunicar apenas o impacto operacional de ativar ou desativar o item.
- Em pedidos, a pessoa operadora deve conseguir alterar fulfillment sabendo que toda mudança ficará auditável; o histórico precisa reduzir dúvida sobre quem mudou status ou rastreio e quando isso aconteceu.
- O feedback após salvar fulfillment deve ser imediato: a própria tela precisa refletir o novo registro de auditoria sem exigir refresh manual.
- O id de pedido exibido para operação e suporte deve ser estável e interno ao produto, para que a equipe não dependa de ids técnicos da Stripe como referência principal do pedido.
- Quando um webhook alterar automaticamente o status de pagamento, a pessoa operadora também deve enxergar esse momento no histórico do pedido com data, hora e origem automática claramente identificadas.
- Em frete, a pessoa operadora precisa conseguir entender rapidamente qual provedor está ativo, qual serviço foi cotado e se a integração está saudável antes de mexer em regras ou credenciais.
- Em settings de frete, a pessoa operadora não deve precisar lembrar o formato de autenticação de cada API; o formulário deve guiar a configuração de Correios, Jadlog e EasyPost com campos já organizados por padrão.
