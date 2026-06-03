# User Experience

## Fonte canônica

- O documento principal de experiência continua sendo `UI_UX_PATTERNS.md`.
- Este arquivo destaca intenções de uso e comportamento para mudanças rápidas em UI/UX.

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
