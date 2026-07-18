# User Experience — Selo Libertária

## Fonte canônica

Este arquivo resume intenção de experiência. Para padrões detalhados, usar `UI_UX_PATTERNS.md`. Para escopo funcional, usar `spec.md`.

## Experiência desejada

A pessoa deve entender rapidamente:

1. que está em uma livraria-editora adulta e autoral;
2. que pode comprar livros/produtos com segurança;
3. que o selo também tem projetos, eventos, Sarau Safado e presença cultural;
4. que a experiência é curada, literária e viva.

## Home

A Home deve responder em menos de um scroll:

- o que é o Selo Libertária;
- qual livro/produto está em destaque;
- onde comprar ou explorar;
- por que o universo importa.

Sequência ideal:

1. impacto e reconhecimento de marca;
2. livro/capa/compra;
3. manifesto curto;
4. catálogo;
5. Sarau/continuidade;
6. newsletter/footer.

Em desktop, a home deve parecer capa editorial navegável. Em mobile, uma narrativa curta e bem espaçada.

## Menu

A navegação deve ser curta e segura:

```text
Livros
Projetos
Sarau Safado
Sobre
Contato
```

A pessoa não deve precisar escolher entre `Eventos` e `Sarau Safado` no menu principal. Eventos podem aparecer como agenda/acervo dentro da experiência cultural.

## Livros / Catálogo

A experiência deve parecer uma seleção editorial:

- capas grandes;
- poucos ruídos promocionais;
- compra rápida;
- contexto suficiente para dar vontade de ler;
- caminhos para PDP.

## PDP / Livro

A pessoa deve conseguir comprar sem esforço, mas também entender a obra.

Prioridade:

1. capa/título/preço/compra;
2. variantes/favorito quando aplicável;
3. sinopse;
4. trecho;
5. ficha técnica;
6. continuidade para outros livros, Sarau ou projetos.

## Páginas editoriais

Essas páginas não devem parecer apêndices.

- Projetos precisa mostrar portfólio cultural com ritmo visual.
- Sarau Safado precisa parecer página central do universo do selo.
- Sobre precisa ser manifesto + autoria, não texto institucional frio.
- Contato precisa ser simples e confiável.
- Eventos pode funcionar como agenda/acervo, mesmo fora do menu principal.

Cada página deve terminar com uma saída clara: catálogo, contato, Sarau, projetos ou newsletter.

## Admin

A pessoa operadora deve entender:

- onde está;
- o que a tela controla;
- o que será publicado;
- quando algo foi atualizado;
- se o conteúdo aparece no site.

O admin editorial deve reduzir ansiedade operacional:

- hub claro;
- cards de entrada;
- metadados simples;
- formulários em blocos;
- upload com prévia;
- botões específicos.

## Fork cleanup como UX

Remover resíduos visíveis de fork também melhora experiência. A pessoa usuária ou administradora não deve encontrar:

- nomes de marcas antigas;
- labels em inglês no meio do `pt-BR`;
- produtos demo fora de contexto;
- CTAs genéricas como `View`, `Browse`, `Open`;
- mensagens técnicas cruas.

## Confiança

Confiança vem de:

- compra clara;
- checkout preservado;
- labels consistentes;
- feedback em português;
- rotas que funcionam em reload;
- mobile sem quebra;
- conteúdo admin refletido no público.

## Atualização 2026-06-24

- A navegação mobile deve confirmar a mesma hierarquia do desktop para não criar dúvida sobre o que é seção principal e o que é conteúdo auxiliar.
- Em busca e catálogo, a linguagem precisa soar editorial e específica; `livros` comunica melhor o domínio do que `produtos`.
- Nas páginas editoriais públicas pós-home, a pessoa deve conseguir entender o assunto e agir em até três movimentos visuais: hero, bloco de contexto, saída clara para compra, agenda, contato ou Sarau.
- Na PDP, a pessoa precisa reconhecer rapidamente que está vendo um livro, entender preço e disponibilidade sem esforço, e ainda receber contexto literário antes de descer para ficha técnica e relacionados.
- O header não deve competir com a compra do livro; ele orienta sessão e navegação, enquanto a decisão de compra fica na própria PDP.
- Em uma rodada curta de estabilização pública, consistência de idioma pesa mais do que detecção automática; se necessário, o público deve ficar inteiro em `pt-BR` até a resolução contextual voltar a ser confiável.
- Em `/events`, a pessoa deve sentir ritmo de agenda, não navegar por um mural genérico: primeiro impacto, depois contexto, depois lista de programação e, por fim, caminhos claros para Sarau Safado, projetos e contato.

## Atualização 2026-06-25

- A pessoa usuária não deve perceber qualquer oscilação de idioma entre páginas, reload, checkout, login ou links antigos com prefixo de locale.
- Links legados com `/en`, `/en-us`, `/es` ou `/pt-br` devem apenas levar com segurança à rota canônica em `pt-BR`, sem criar uma experiência paralela.
- A confiança do produto agora depende de um contrato simples: textos técnicos em português, conteúdo editorial vindo do admin quando editável e fallbacks sempre em português do Brasil.
## Addendum — P3.75B

- A dona do site deve conseguir alterar a narrativa pública principal sem deploy.
- A experiência editorial pública depende do admin como fonte primária de copy.
- A manutenção preserva labels técnicos estáveis em `pt-BR` para reduzir atrito operacional.

## Atualização 2026-06-29

- Na tela `/admin/settings`, a pessoa operadora não deve tomar decisões sobre provedores de frete; ela só ativa ou pausa a cotação e ajusta parâmetros operacionais do Melhor Envio em um bloco único e claro.
- Credenciais ficam fora do admin para reduzir risco operacional; a interface deve deixar explícito que o token permanece no ambiente do servidor e nunca é salvo no Mongo.

## Atualização 2026-06-30

- `Adicionar ao carrinho` no catálogo deve manter a pessoa na página e sinalizar continuidade pelo badge do carrinho.
- `Comprar` na grade deve funcionar como atalho de compra imediata para o checkout quando a variante já estiver segura.
- Mesmo discreto, o carrinho precisa permanecer encontrável durante toda a navegação pública; no mobile, um atalho flutuante só deve aparecer depois da primeira adição ao carrinho.
## Atualização 2026-06-30 — checkout convidado

- No checkout, a pessoa visitante deve sentir continuidade de compra, não uma interrupção de cadastro: os dados pessoais entram como parte natural do pedido e a conta nasce depois da confirmação.
- Quando a compra for concluída sem senha prévia, o acesso à conta deve chegar por e-mail com um próximo passo único e claro: abrir o magic link, rever o pedido e criar senha se desejar continuar usando a conta.

## Atualização 2026-07-01
- No checkout e nos formulários de conta/cadastro, a pessoa não deve tomar decisão sobre país neste estágio: a interface fixa `Brasil` e comunica com clareza que a entrega atual atende somente destinos brasileiros.
- Quando esse travamento estiver ativo, a experiência deve evitar ruído visual: em vez de mostrar um campo de país bloqueado, basta ocultá-lo e manter a comunicação curta sobre atendimento apenas no Brasil.
- No admin de frete, a pessoa operadora deve entender rapidamente se o token de ambiente do Melhor Envio está presente, sem ver segredo, sem copiar credencial e sem confundir o estado atual com a futura conexão OAuth.
- No checkout, a validação dos dados pessoais deve reduzir retrabalho: formatar `CPF` e `Telefone` enquanto a pessoa digita, apontar erros no próprio campo e impedir tentativa de pagamento quando nome completo, e-mail, CPF ou telefone ainda não estiverem coerentes.
- Em `Livros`, a pessoa deve sentir uma entrada editorial já na primeira dobra: fundo preto, texto curto, capa em destaque e saída clara para continuar no catálogo sem parecer uma listagem genérica.
- Ao acionar `Ver catálogo` dentro de `/products`, a experiência correta é continuidade no mesmo documento com rolagem até os livros publicados, nunca um botão sem efeito aparente.
- Depois de um `Adicionar ao carrinho` como visitante, a pessoa precisa perceber continuidade imediata no mesmo lugar: badge no header, drawer e checkout devem mostrar exatamente o mesmo item, sem oscilar para estado vazio.
- O drawer do carrinho deve parecer uma extensão calma da livraria, não um painel promocional pesado: cabeçalho preto para orientação, corpo em papel para leitura e vinho apenas como acento de ação e feedback.
- 2026-07-02: no admin, a pessoa operadora deve reconhecer a marca já no topo da sidebar e do menu móvel; o logo oficial precisa ocupar esse ponto de orientação sem competir com a navegação nem parecer avatar vazio.
- 2026-07-02: no admin editorial de páginas singleton, a experiência deve evitar burocracia sem efeito prático; a pessoa operadora precisa editar só o que aparece no site e decidir apenas se a versão está em rascunho ou publicada.
- 2026-07-02: ao editar conteúdo no admin editorial, a pessoa operadora não deve precisar voltar ao fim da página para concluir a ação; o `Salvar` precisa permanecer acessível durante a rolagem como continuidade natural do formulário inteiro.
## Atualização 2026-07-18

- Ao editar textos editoriais, a pessoa operadora deve ter ferramentas suficientes para ênfase e ritmo de leitura sem precisar aprender um editor completo.
- As ações de texto não devem mudar a persistência dos blocos: salvar continua sendo o mesmo fluxo do formulário editorial.
- Conteúdo antigo deve continuar legível e previsível no site público, mesmo que não use nenhuma marcação.

## Atualização 2026-07-18 — imagens editoriais

- Ao editar imagens editoriais, pessoa operadora precisa ver a prévia local antes do envio, confirmar a troca com intenção clara e descartar a seleção sem perder a imagem já publicada.
- A troca de imagem só deve virar conteúdo público depois de salvar o formulário editorial, preservando o fluxo de revisar primeiro e publicar depois.

## Atualização 2026-07-18 — validação do fluxo editorial

- A experiência esperada é reversível até o salvamento: selecionar e confirmar uma imagem mostra prévia local; descartar remove a troca pendente; salvar persiste somente a intenção final.
- Conteúdo antigo deve continuar público e legível após a introdução das ferramentas, sem exigir reedição manual dos blocos legados.
