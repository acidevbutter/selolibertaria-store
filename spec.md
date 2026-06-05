# Product Implementation Spec

## Objetivo

Implementar as funcionalidades e a identidade de conteúdo do Selo Libertária dentro do site deste repositório, preservando a arquitetura de loja já existente e mesclando e-commerce com camadas institucionais, editoriais e culturais.

O resultado desejado não é trocar a loja por um site institucional, e sim transformar a storefront atual em uma plataforma híbrida:

- loja de livros e produtos;
- vitrine editorial de autora, selo e publicações;
- calendário e acervo de eventos;
- portfólio de projetos culturais;
- página dedicada ao `Sarau Safado`;
- contato e presença social.

## Base de referência

- mapa do site atual em Wix: [SELOLIBERTARIA_SITE_MAP.md](./SELOLIBERTARIA_SITE_MAP.md)
- padrões atuais de interface e experiência: [UI_UX_PATTERNS.md](./UI_UX_PATTERNS.md)
- resumo rápido de UI: [userinterface.md](./userinterface.md)
- resumo rápido de UX: [userexperience.md](./userexperience.md)

## Princípio central

Manter a espinha dorsal de comércio já pronta no projeto e acoplar a ela as superfícies de conteúdo do Selo Libertária sem quebrar:

- catálogo por produto e variante;
- carrinho;
- checkout;
- conta de cliente;
- favoritos;
- promoções;
- admin de produtos, pedidos e emails.

## Visão de produto

O novo site deve funcionar em dois modos complementares ao mesmo tempo:

1. modo `storefront`
   - compra de livros, produtos e futuras edições;
   - navegação por catálogo, produto, carrinho e checkout.

2. modo `editorial-cultural`
   - apresentação da autora e do selo;
   - divulgação de eventos, saraus e projetos;
   - publicação de contexto, trajetória e registros visuais;
   - fortalecimento de marca e descoberta de catálogo.

Esses dois modos devem se reforçar mutuamente. Conteúdo editorial deve levar à loja, e a loja deve contextualizar o universo do Selo Libertária.

## Direções visuais candidatas

Estas direções existem para orientar exploração, prototipação e implementação do rebrand sem perder coerência com a proposta do selo. Enquanto nenhuma delas for escolhida como direção final, elas devem ser tratadas como trilhas válidas de estudo, e não como mistura simultânea.

### 1. Editorial Noturno

#### Essência

Uma livraria-editora adulta, densa e sofisticada, com atmosfera noturna, calor urbano e sensualidade literária.

#### Características

- paleta em vinho profundo, ameixa, tabaco, preto avermelhado, cobre e creme;
- títulos com serifas expressivas e corpo de leitura mais sóbrio;
- uso de capas, retratos, fotos de performance e trechos literários como matéria principal;
- sensação de revista cultural contemporânea com camada de e-commerce discreta, porém eficiente.

#### Quando usar

- quando a prioridade for transmitir maturidade, autoria e desejo sem cair em excesso visual;
- quando a marca precisar parecer culta, quente e memorável logo na primeira dobra.

### 2. Barroco Contemporâneo

#### Essência

Uma direção mais dramática, artística e tátil, com forte presença de composição, contraste e ornamentação controlada.

#### Características

- paleta mais rica, com vermelho queimado, dourado envelhecido, osso, sépia e sombras profundas;
- layouts com sobreposições, molduras, recortes visuais e respiros teatrais;
- hero e páginas institucionais com presença quase expositiva;
- maior destaque para imagem, gesto curatorial e atmosfera.

#### Quando usar

- quando o objetivo for enfatizar performance, corpo, ritual, palco e intensidade cultural;
- quando houver bom acervo fotográfico para sustentar uma identidade mais cenográfica.

### 3. Urbano Sensual Minimalista

#### Essência

Uma linguagem mais seca e contemporânea, com tensão sexual sugerida por tipografia, contraste e ritmo, sem excesso decorativo.

#### Características

- base em preto, off-white, ferrugem, vermelho terroso e cinza quente;
- grid mais rígido, blocos grandes, poucos elementos por seção e hierarquia muito clara;
- mistura de brutalismo leve com refinamento editorial;
- foco em leitura rápida, conversão e presença cultural sem ruído.

#### Quando usar

- quando a prioridade for clareza comercial, modernidade e impacto visual mais limpo;
- quando se quiser fugir de qualquer aparência de template sem depender de ornamento.

### Recomendação atual

A direção mais alinhada ao Selo Libertária neste momento é `Editorial Noturno`, porque ela equilibra melhor:

- erotismo adulto sem caricatura;
- sofisticação editorial sem frieza institucional;
- calor cultural sem perder legibilidade de loja;
- espaço para livros, eventos, autora e Sarau Safado coexistirem no mesmo sistema.

## Escopo funcional

### 1. Rebranding do storefront para Selo Libertária

#### Objetivo

Substituir a base genérica `Storefront` por uma identidade explícita de Selo Libertária, sem desmontar a estrutura técnica existente.

#### Entregas

- metadata global do site com nome, descrição e sinais de marca do Selo Libertária;
- atualização de header, footer e pontos institucionais principais;
- revisão de textos placeholder em home, about, contact, faq, emails e admin onde houver resíduos genéricos;
- definição de ativos canônicos de marca em `public/`.

#### Regras

1. O rebrand deve acontecer de forma consistente em UI, metadata, emails e documentação principal.
2. Não substituir a arquitetura da loja por páginas estáticas.
3. O selo deve ser apresentado como editora e produtora cultural com foco autoral.

### 2. Home híbrida

#### Objetivo

Transformar a home atual em uma landing híbrida que una descoberta editorial e conversão para compra.

#### Seções recomendadas

1. hero institucional
   - apresentação curta do Selo Libertária;
   - CTA para `Loja`;
   - CTA para `Projetos` ou `Sarau Safado`.

2. destaque de livros
   - vitrine curta de lançamentos, destaques ou livros principais;
   - ligação direta com PDPs existentes.

3. bloco editorial
   - texto breve sobre a autora, o selo e a proposta curatorial.

4. agenda ou destaques culturais
   - próximos eventos, projetos ou chamadas de portfólio.

5. seção visual
   - galeria curta com imagens fortes de livros, eventos e performances.

6. CTA de contato e redes
   - acesso ao contato e aos canais sociais.

#### Regras

1. A home deve continuar priorizando performance e SSR onde fizer sentido.
2. Os blocos editoriais não devem esconder a loja nem empurrar produtos para baixo de forma excessiva.
3. O hero deve comunicar imediatamente que o site vende livros e também apresenta uma atuação cultural mais ampla.

#### Blueprint recomendado para a home

##### Direção escolhida para exploração inicial

`Editorial Noturno`

##### Moodboard textual

- atmosfera de livraria autoral aberta à noite, com calor urbano e sensação de segredo compartilhado;
- mistura de literatura, corpo, cidade, palco, recital, conversa e objeto impresso;
- sofisticação sem frieza, erotismo sem caricatura, intensidade sem poluição visual;
- capas de livros, retratos, registros de performance e trechos curtos como principais portadores de desejo.

##### Paleta-base sugerida

- fundo principal: vinho profundo ou preto com subtom avermelhado;
- superfícies secundárias: ameixa escura, tabaco, marrom queimado;
- contraste: creme, osso, areia quente;
- acentos: cobre, ferrugem, vermelho terroso;
- uso pontual de vermelho mais saturado apenas em estados ativos ou chamadas específicas.

##### Tipografia sugerida

- títulos: serifada expressiva, literária e elegante;
- corpo e navegação: sans contemporânea, limpa e discreta;
- trechos editoriais e citações podem usar corpo maior, respiro mais generoso e largura controlada para criar cadência de leitura.

##### Estrutura proposta

1. faixa superior discreta
   - mensagem curta de universo da marca, como lançamentos, agenda ou frete;
   - deve parecer nota editorial, não banner promocional agressivo.

2. hero institucional-comercial
   - título forte sobre literatura erótica, edição e produção cultural;
   - subtítulo curto explicando o que é o selo;
   - CTA primária para `Comprar livros`;
   - CTA secundária para `Ver agenda` ou `Conhecer o Sarau Safado`;
   - imagem ou composição com capa, retrato e textura.

3. vitrine de livros em destaque
   - três ou quatro títulos principais;
   - cada card com capa, preço, formato e microtexto curatorial;
   - prioridade para escaneabilidade e desejo de clique.

4. manifesto editorial
   - bloco curto explicando a proposta do selo em linguagem firme;
   - deve conectar literatura, cidade, erotismo, performance e autoria.

5. agenda e projetos
   - dois trilhos complementares:
     - próximos eventos ou edições em destaque;
     - projetos culturais ou portfólio recente;
   - a leitura deve deixar claro que o selo não é só loja.

6. seção visual imersiva
   - mosaico ou composição de imagens de livros, encontros, palco e bastidores;
   - pode incluir um trecho curto de livro ou frase-manifesto sobreposto.

7. bloco sobre autora e selo
   - resumo curto sobre Natália Nolli Sasso e o papel do Selo Libertária;
   - CTA para `Sobre` ou página institucional equivalente.

8. fechamento comunitário
   - contato, newsletter e redes;
   - convite a acompanhar lançamentos, saraus e programação.

##### Copy-base sugerida

###### Hero

- eyebrow: `livros, performance e literatura erótica`
- título: `Uma livraria-editora para quem lê com o corpo inteiro.`
- apoio: `O Selo Libertária reúne livros, projetos culturais, saraus e publicações autorais de Natália Nolli Sasso em uma experiência de leitura, presença e desejo.`
- CTA 1: `Comprar livros`
- CTA 2: `Explorar agenda`

###### Manifesto editorial

- título: `Literatura para incendiar linguagem, cidade e imaginação.`
- texto: `Entre publicações, encontros e performance, o Selo Libertária constrói um catálogo autoral para adultos, onde o livro é obra, gesto e presença cultural ao mesmo tempo.`

###### Fechamento

- título: `Acompanhe os próximos livros, saraus e projetos.`
- texto: `Entre em contato, siga as redes e acompanhe a programação do selo.`

##### Regras de implementação

1. O hero precisa vender a proposta em menos de um scroll.
2. A loja deve aparecer cedo, mas nunca isolada do universo editorial.
3. Cada seção precisa ter uma função clara: converter, contextualizar ou aprofundar.
4. A home deve parecer curada, não empilhada.
5. Em mobile, a ordem das seções deve preservar impacto de marca primeiro, vitrine logo depois e agenda antes do fechamento.

#### Wireframe textual de alta fidelidade

##### 1. Header

###### Desktop

- faixa superior fina com mensagem editorial curta:
  - exemplo: `novos livros, agenda cultural e edições autorais`
- header principal com:
  - marca à esquerda;
  - navegação central: `Livros`, `Eventos`, `Projetos`, `Sarau Safado`, `Sobre`, `Contato`;
  - ações à direita: busca, conta, favoritos, carrinho.

###### Mobile

- marca à esquerda;
- botão de menu e carrinho à direita;
- faixa editorial pode permanecer acima ou ser condensada em texto curto.

###### Intenção

- parecer um selo cultural com operação de loja real;
- evitar header pesado ou promocional.

##### 2. Hero institucional-comercial

###### Estrutura

- layout em duas colunas no desktop e pilha no mobile;
- coluna esquerda com copy e CTAs;
- coluna direita com composição visual.

###### Conteúdo da coluna esquerda

- eyebrow:
  - `livros, performance e literatura erótica`
- título em 2 ou 3 linhas:
  - `Uma livraria-editora para quem lê com o corpo inteiro.`
- parágrafo de apoio:
  - `O Selo Libertária reúne livros, projetos culturais, saraus e publicações autorais de Natália Nolli Sasso em uma experiência de leitura, presença e desejo.`
- linha de CTA:
  - botão primário: `Comprar livros`
  - botão secundário: `Explorar agenda`
- apoio curto abaixo:
  - `livros impressos, livros sonoros, encontros e projetos culturais`

###### Conteúdo da coluna direita

- composição com:
  - uma capa principal em destaque;
  - uma imagem de performance ou retrato;
  - textura ou campo de cor profundo ao fundo;
  - pequeno trecho literário ou selo curto sobreposto.

###### Comportamento visual

- o bloco deve ocupar quase toda a primeira dobra;
- a imagem não deve parecer banner de loja comum;
- o resultado deve parecer capa de revista cultural com CTA funcional.

##### 3. Vitrine: livros em destaque

###### Cabeçalho da seção

- label pequeno:
  - `catálogo em destaque`
- título:
  - `Livros para entrar nesse universo pela leitura.`
- link auxiliar:
  - `Ver catálogo completo`

###### Grade

- 3 ou 4 cards em desktop;
- 1 por linha ou carrossel simples em mobile.

###### Estrutura de cada card

- capa grande;
- título;
- formato ou subtipo:
  - `livro impresso`, `livro sonoro`, `edição especial`;
- microcopy curatorial de uma linha;
- preço;
- CTA rápida;
- favorito.

###### Exemplo de microcopy

- `poesia erótica em trânsito pela cidade`
- `um livro para desejo, ruína e imaginação urbana`

###### Intenção

- transformar a vitrine em seleção editorial, não em prateleira seca.

##### 4. Manifesto editorial

###### Estrutura

- bloco de largura controlada, com bastante respiro;
- pode entrar sobre fundo mais escuro ou superfície contrastante.

###### Conteúdo

- título:
  - `Literatura para incendiar linguagem, cidade e imaginação.`
- texto:
  - `Entre publicações, encontros e performance, o Selo Libertária constrói um catálogo autoral para adultos, onde o livro é obra, gesto e presença cultural ao mesmo tempo.`
- link de aprofundamento:
  - `Conheça o selo`

###### Intenção

- dar contexto e elevar o valor simbólico da loja antes da próxima dobra utilitária.

##### 5. Agenda e projetos

###### Estrutura

- seção em dois blocos paralelos no desktop;
- pilha vertical no mobile.

###### Bloco A: agenda

- label:
  - `agenda`
- título:
  - `Próximos encontros, leituras e aparições do selo.`
- lista curta de 2 ou 3 itens com:
  - data;
  - nome do evento;
  - local;
  - CTA `Ver evento`.

###### Estado sem evento futuro

- trocar por:
  - `Arquivo de encontros e intervenções culturais`
- manter CTA para página de eventos.

###### Bloco B: projetos

- label:
  - `projetos`
- título:
  - `Uma atuação que atravessa livro, palco e formação.`
- cards curtos com imagem, título e frase de contexto;
- CTA `Ver projetos`.

###### Intenção

- deixar claro que a marca tem vida cultural contínua, não apenas catálogo.

##### 6. Seção visual imersiva

###### Estrutura

- mosaico assimétrico ou composição de 3 a 5 imagens;
- uma frase sobreposta ou bloco de citação.

###### Conteúdo sugerido

- imagens de capas, encontros, bastidores, palco e retratos;
- frase curta:
  - `ler também pode ser uma forma de acender presença`

###### Intenção

- criar pausa emocional e aumentar memorabilidade.

##### 7. Bloco autora e selo

###### Estrutura

- imagem ou retrato de Natália em uma coluna;
- texto em outra coluna.

###### Conteúdo

- label:
  - `autora e curadoria`
- título:
  - `Natália Nolli Sasso e o universo do Selo Libertária`
- texto curto de apresentação;
- links:
  - `Sobre a autora`
  - `Conhecer o Sarau Safado`

###### Intenção

- personificar o projeto sem reduzir o selo a uma bio isolada.

##### 8. Fechamento comunitário

###### Estrutura

- bloco final com headline, texto curto e captação de relacionamento.

###### Conteúdo

- título:
  - `Acompanhe os próximos livros, saraus e projetos.`
- texto:
  - `Receba novidades, siga as redes e entre em contato para convites, parcerias e programação cultural.`
- ações:
  - campo de newsletter, se existir;
  - botão `Entrar em contato`;
  - links sociais.

###### Intenção

- terminar a home com continuidade, não com encerramento abrupto.

##### 9. Footer

###### Conteúdo

- navegação auxiliar;
- email e redes;
- copyright;
- métodos de pagamento;
- eventual assinatura de desenvolvimento em lockup discreto.

###### Intenção

- reforçar confiança operacional sem quebrar o clima editorial.

#### Mock textual visual da home

Este mock descreve sensação, proporção, densidade e ritmo visual da página, aproximando a leitura de uma direção de arte antes da implementação.

##### Vista desktop

###### 1. Entrada da página

- o topo abre em fundo profundo, quase negro com calor vinho;
- há uma faixa fina acima do header com texto editorial pequeno, em creme suave, funcionando como sussurro de marca;
- o header principal flutua com bastante respiro lateral, sem parecer barra pesada de e-commerce.

###### Sensação

- o primeiro impacto deve lembrar capa de revista cultural e livraria de catálogo autoral ao mesmo tempo;
- nada de banner promocional genérico;
- a elegância vem do silêncio, da escala e do contraste.

###### 2. Primeira dobra

- a dobra inicial ocupa quase a altura inteira da tela;
- a coluna esquerda usa muito respiro, título grande e linhas curtas;
- a coluna direita funciona como composição, não como imagem isolada.

###### Composição visual

- uma capa de livro em destaque, vertical e nítida;
- atrás dela, uma fotografia ou retrato em tom quente, parcialmente recortado;
- um campo de cor escura envolvendo tudo;
- um pequeno trecho ou frase editorial pairando sobre a composição;
- sombras suaves e sensação de profundidade, sem excesso de efeito.

###### Ritmo da copy

- eyebrow pequena e espaçada;
- título dominante;
- parágrafo curto;
- CTAs alinhadas e com peso distinto;
- uma última linha de apoio mais discreta.

###### 3. Transição para vitrine

- a descida do hero para a vitrine não deve ser brusca;
- pode haver uma borda de luz, degradê ou faixa de transição que mantenha a página contínua;
- o usuário precisa sentir que continua no mesmo universo, só que entrando agora no catálogo.

###### 4. Vitrine de livros

- fundo ainda escuro, mas um pouco mais aberto do que o hero;
- título de seção alinhado à esquerda, com link auxiliar à direita;
- cards com bastante presença de capa e pouco ruído ao redor.

###### Aparência dos cards

- capas altas, bonitas e protagonistas;
- títulos com bom tamanho e ar editorial;
- metadados discretos;
- preço visível, porém não berrando;
- quick actions elegantes, leves e integradas.

###### Sensação

- a vitrine deve parecer uma mesa de curadoria, não uma grade de liquidação.

###### 5. Manifesto editorial

- depois da vitrine, a página respira;
- entra um bloco mais limpo, com coluna estreita ou texto centralizado em largura controlada;
- aqui o foco é cadência, não volume.

###### Sensação

- a leitura deve desacelerar;
- esse bloco legitima o projeto e faz a pessoa permanecer por interesse, não apenas por compra.

###### 6. Agenda e projetos

- retomada de densidade visual em dois blocos lado a lado;
- um lado mais temporal, outro mais institucional-cultural;
- cada bloco com imagem ou miniatura, mas sem excesso.

###### Hierarquia

- agenda precisa parecer viva;
- projetos precisam parecer consistentes e compartilháveis;
- nenhum dos dois deve parecer coluna secundária irrelevante.

###### 7. Seção visual imersiva

- aqui a página pode abrir mais horizontalmente;
- mosaico assimétrico ou faixa visual com imagens recortadas;
- uma frase curta sobreposta, com peso poético.

###### Sensação

- esse é o momento menos utilitário e mais memorável da home;
- ele injeta desejo, textura e presença corporal na experiência.

###### 8. Autora e selo

- volta a uma estrutura mais clara de leitura;
- retrato ou imagem à esquerda, texto à direita;
- contraste de tons mais suave para preparar o fechamento.

###### Sensação

- intimidade, autoria e consistência;
- não deve parecer uma bio protocolar.

###### 9. Fechamento comunitário

- bloco final com maior sensação de abertura;
- fundo levemente distinto, ainda quente;
- CTA de contato e acompanhamento como convite, não como cobrança.

###### Sensação

- a pessoa sai com impressão de continuidade;
- o site parece ativo, vivo e relacional.

##### Vista mobile

###### 1. Ritmo geral

- a experiência precisa manter atmosfera sem depender de grandes composições lado a lado;
- no mobile, o impacto vem de pilha bem espaçada, imagens fortes e título muito bem quebrado.

###### 2. Hero

- marca e ações no topo com altura contida;
- título grande, porém com excelente legibilidade;
- CTAs empilhadas ou lado a lado só se houver espaço confortável;
- composição visual entra logo abaixo da copy, sem esmagar texto.

###### 3. Vitrine

- cards podem entrar em pilha ou carrossel horizontal suave;
- capa continua protagonista;
- quick add e favorito permanecem claros sem depender de hover.

###### 4. Manifesto

- texto mais curto do que no desktop;
- generoso espaçamento vertical;
- largura confortável para leitura com polegar e olho descansados.

###### 5. Agenda e projetos

- agenda primeiro, projetos depois;
- cada item com informação suficiente para decidir clique sem exigir leitura longa.

###### 6. Imersão visual

- poucas imagens por vez;
- frase sobreposta ou abaixo do mosaico;
- evitar poluição por excesso de recorte em tela pequena.

###### 7. Fechamento

- newsletter, contato e redes em ordem muito clara;
- nenhum link pode parecer escondido ou comprimido.

##### Proporção e densidade por seção

- hero: grande, dominante, aproximadamente `85vh` a `100vh` no desktop;
- vitrine: densa, mas organizada;
- manifesto: rarefeito e respirado;
- agenda/projetos: média densidade;
- seção visual: ampla e impactante;
- autora/selo: média densidade com tom mais íntimo;
- fechamento: leve, claro e conclusivo.

##### Contraste e luz

- o site não deve ser chapado num único tom escuro;
- trabalhar camadas de escuro quente, superfícies tabaco, acentos cobre e textos creme;
- CTAs primárias podem usar contraste mais firme, mas sempre dentro da paleta quente.

##### Movimento

- entrada da primeira dobra com revelação suave de título, imagem e CTAs;
- cards surgem com leve stagger;
- imagens podem ter deslocamento mínimo no scroll;
- evitar microinterações genéricas demais.

##### O que evitar

- cara de template premium genérico;
- excesso de ornamento dourado;
- linguagem fetichizada ou visualmente óbvia;
- saturação constante de vermelho;
- grids apertados e blocos com pouco respiro;
- homepage com muitas chamadas concorrendo ao mesmo tempo.

#### Plano de componentes da home

Este plano converte a direção visual em peças reais de interface, priorizando reaproveitamento da base atual da storefront e separando claramente o que pode ser extraído como componente reutilizável.

##### Estado atual aproveitável

- `src/app/(store)/page.tsx`
  - já organiza hero, vitrine, CTAs editoriais e bloco institucional;
- `src/ui/products/product-list.tsx`
  - já resolve catálogo, favoritos, variações e quick add;
- `src/ui/about-section.tsx`
  - já oferece um bloco institucional com imagem + texto;
- `src/ui/nav/nav.tsx`
  - já concentra marca, navegação, busca, conta e carrinho;
- `src/ui/footer/footer.tsx` e `src/ui/footer/footer.client.tsx`
  - já sustentam newsletter, links, redes e métodos de pagamento;
- `src/lib/selolibertaria-content.ts`
  - já funciona como fonte de conteúdo inicial para o rebrand.

##### Objetivo do plano

Evoluir a home atual para o modelo `Editorial Noturno` sem reescrever a storefront inteira, usando composição de seções especializadas e conteúdo mais curado.

##### Estrutura recomendada de componentes

###### 1. `HomeTopBar`

####### Função

- renderizar a faixa editorial fina acima da navegação principal.

####### Conteúdo

- mensagem curta de agenda, lançamentos ou posicionamento.

####### Tipo

- componente server simples.

####### Observações

- pode ser incorporado em `Nav` ou ficar como peça própria dentro do layout da store.

###### 2. `HomeHero`

####### Função

- substituir o hero atual por uma seção editorial-comercial mais forte.

####### Conteúdo

- eyebrow;
- título principal;
- texto de apoio;
- CTAs;
- composição visual com capa, retrato e trecho.

####### Tipo

- server component, desde que a animação seja feita por classes CSS;
- virar client component apenas se houver comportamento visual dependente de viewport ou interação avançada.

####### Dependências

- `YnsLink`;
- `next/image`;
- conteúdo vindo de `selolibertaria-content`.

###### 3. `HomeFeaturedBooks`

####### Função

- embrulhar a vitrine de catálogo com cabeçalho editorial específico.

####### Conteúdo

- label da seção;
- título;
- link para catálogo completo;
- `ProductList`.

####### Tipo

- server component.

####### Observações

- `ProductList` deve continuar como motor da grade;
- a camada nova fica no enquadramento editorial da seção, não no core da listagem.

###### 4. `HomeManifesto`

####### Função

- apresentar o posicionamento do selo em um bloco curto e respirado.

####### Conteúdo

- título;
- parágrafo manifesto;
- CTA para `Sobre`.

####### Tipo

- server component.

###### 5. `HomeProgramGrid`

####### Função

- reunir `Agenda` e `Projetos` em uma seção com duas colunas complementares.

####### Subcomponentes internos

- `HomeAgendaPanel`
- `HomeProjectsPanel`

####### Conteúdo

- 2 ou 3 itens por lado;
- headline curta;
- CTA para página de detalhe.

####### Tipo

- server component.

####### Fonte de dados inicial

- `seloEvents`;
- `seloProjects`.

###### 6. `HomeImmersiveGallery`

####### Função

- criar a pausa visual mais emocional da home.

####### Conteúdo

- mosaico de imagens;
- frase curta ou citação sobreposta.

####### Tipo

- server component se for estático;
- client component só se houver animação de scroll realmente necessária.

####### Observações

- deve nascer desacoplado para reaproveitamento futuro em `about`, `events` ou `sarau-safado`.

###### 7. `HomeAuthorSpotlight`

####### Função

- apresentar autora e selo em bloco mais íntimo e humano.

####### Estratégia

- pode começar como evolução de `AboutSection`;
- se o layout divergir bastante, extrair um novo componente e manter `AboutSection` para outras páginas.

####### Conteúdo

- retrato;
- apresentação curta;
- CTA para `Sobre` e `Sarau Safado`.

###### 8. `HomeCommunityCta`

####### Função

- criar o fechamento com newsletter, contato e redes antes do footer.

####### Conteúdo

- headline final;
- texto de continuidade;
- CTA principal de contato;
- apoio de newsletter ou redes.

####### Tipo

- server component com eventual uso de componente client apenas para o formulário de newsletter.

##### Ajustes em componentes existentes

###### `Nav`

- adicionar suporte visual à faixa editorial superior;
- avaliar redução de peso do header para parecer menos barra utilitária e mais moldura cultural;
- manter busca, conta e carrinho.

###### `HeroShell`

- no estado atual, `HeroShell` é guiado por tema e não pela direção do rebrand;
- idealmente ele deve ser substituído por um wrapper mais específico da home ou deixar de existir, caso o novo hero controle diretamente seu fundo, borda, respiro e atmosfera.

###### `ProductList`

- manter a lógica de catálogo;
- não mover para dentro de uma abstração excessiva;
- se necessário, permitir customização de título auxiliar ou microcopy por card numa etapa posterior, mas sem bloquear a primeira implementação da home.

###### `AboutSection`

- avaliar se vale:
  - manter `AboutSection` como bloco genérico institucional;
  - ou transformá-lo em `AuthorEditorialSection` mais alinhado ao rebrand.

###### `FooterClient`

- manter a arquitetura atual;
- ajustar apenas tom visual, hierarchy e copy para conversar melhor com a nova home.

##### Conteúdo recomendado em `src/lib/selolibertaria-content.ts`

Adicionar ou reorganizar estruturas para alimentar cada seção da home:

- `seloHomeTopBar`
- `seloHomeHero`
- `seloHomeManifesto`
- `seloHomeFeaturedBooksIntro`
- `seloHomeAgenda`
- `seloHomeProjectsIntro`
- `seloHomeImmersiveGallery`
- `seloHomeAuthorSpotlight`
- `seloHomeCommunityCta`

Isso reduz hardcode dentro de `page.tsx` e facilita futuras revisões de copy.

##### Estrutura de arquivos sugerida

- `src/ui/home/home-top-bar.tsx`
- `src/ui/home/home-hero.tsx`
- `src/ui/home/home-featured-books.tsx`
- `src/ui/home/home-manifesto.tsx`
- `src/ui/home/home-program-grid.tsx`
- `src/ui/home/home-immersive-gallery.tsx`
- `src/ui/home/home-author-spotlight.tsx`
- `src/ui/home/home-community-cta.tsx`

Se o volume inicial precisar ser menor, os dois primeiros candidatos a extração são:

- `home-hero.tsx`
- `home-program-grid.tsx`

##### Ordem ideal de implementação

1. reorganizar `selolibertaria-content.ts` para refletir a nova home;
2. extrair `HomeHero`;
3. extrair `HomeFeaturedBooks`;
4. criar `HomeManifesto`;
5. criar `HomeProgramGrid`;
6. decidir se `AboutSection` evolui para `HomeAuthorSpotlight` ou se um novo componente nasce;
7. criar `HomeCommunityCta`;
8. ajustar `Nav` e `Footer` para amarrar a direção `Editorial Noturno`;
9. refatorar `src/app/(store)/page.tsx` para virar apenas composição das seções.

##### Meta de arquitetura final da página

No estado final, `src/app/(store)/page.tsx` deve parecer uma montagem limpa de blocos de alto nível, com pouca copy inline e sem regras visuais espalhadas:

- `HomeTopBar`
- `HomeHero`
- `HomeFeaturedBooks`
- `HomeManifesto`
- `HomeProgramGrid`
- `HomeImmersiveGallery`
- `HomeAuthorSpotlight`
- `HomeCommunityCta`

Essa estrutura favorece manutenção, evolução visual por seção e reaproveitamento de linguagem nas páginas institucionais futuras.

### 3. Loja integrada à narrativa editorial

#### Objetivo

Manter a estrutura de catálogo atual, mas contextualizar melhor os produtos do Selo Libertária.

#### Entregas

- adaptação da listagem de produtos para livros, publicações e possíveis itens relacionados;
- suporte a copy editorial por produto ou grupo de produto;
- encaixe de contexto institucional em páginas de produto sem prejudicar compra;
- eventuais coleções como `Livros`, `Livros sonoros`, `Destaques`, `Projetos relacionados`.

#### Regras

1. PDP continua centrada em compra, preço, variantes e imagens.
2. Blocos editoriais em PDP devem ser secundários à CTA de compra.
3. Se um livro tiver contexto cultural forte, esse contexto pode aparecer abaixo da dobra ou em seção lateral, sem quebrar o fluxo comercial.

### 4. Página institucional `Sobre` ou equivalente

#### Objetivo

Criar uma superfície clara para explicar o que é o Selo Libertária, quem é Natália Nolli Sasso e como o selo atua.

#### Conteúdo esperado

- apresentação da autora;
- apresentação do selo;
- resumo da linha editorial;
- histórico curto de publicações e atuação;
- links para loja, projetos e sarau.

#### Regras

1. A página deve ser institucional, mas ainda conectada à compra e aos eventos.
2. O texto pode ser mais denso que o da home, mas precisa continuar escaneável.

### 5. Página `Projetos / Portfolio`

#### Objetivo

Levar para o projeto atual a seção de portfólio cultural mapeada no site Wix.

#### Estrutura recomendada

- grid ou lista de projetos;
- cada item com título, descrição curta, data/período, local, créditos e imagem;
- possibilidade de página de detalhe futura, se necessário.

#### Funcionalidade mínima

- gestão inicialmente pode ser estática ou baseada em coleção simples;
- cada projeto precisa suportar:
  - título;
  - slug;
  - descrição curta;
  - descrição longa;
  - imagem de capa;
  - galeria opcional;
  - data ou período;
  - local;
  - créditos;
  - CTA opcional.

#### Regras

1. O portfólio não deve ficar escondido como subproduto da loja.
2. Projetos precisam ser facilmente compartilháveis por URL.

### 6. Página `Eventos`

#### Objetivo

Criar uma superfície dedicada a eventos com autores, encontros e registros culturais.

#### Estrutura recomendada

- destaques de próximos eventos, quando existirem;
- acervo de eventos passados;
- imagens, locais, datas e descrições curtas;
- CTA para contato ou inscrição, quando aplicável.

#### Modelo funcional recomendado

Cada evento deve suportar:

- título;
- slug;
- status: `upcoming`, `past`, `draft`;
- data ou período;
- local;
- descrição curta;
- descrição longa;
- imagem principal;
- galeria opcional;
- link externo opcional;
- flag para destaque na home.

#### Regras

1. A camada de eventos deve permitir convivência entre agenda futura e acervo passado.
2. Caso não exista agenda futura, a página deve continuar forte como arquivo visual e editorial.

### 7. Página `Sarau Safado`

#### Objetivo

Criar uma página dedicada ao Sarau Safado, com identidade própria dentro do ecossistema do site.

#### Conteúdo esperado

- origem do sarau;
- papel de Natália Nolli Sasso na curadoria;
- contexto histórico;
- imagens;
- ligação com eventos, livros e contato.

#### Regras

1. A página pode ter tratamento visual um pouco mais autoral, desde que ainda coerente com o restante do produto.
2. O Sarau Safado deve parecer uma iniciativa principal do selo, não uma nota lateral.

### 8. Contato e presença social

#### Objetivo

Atualizar a página de contato para refletir o Selo Libertária e seus canais reais.

#### Entregas

- revisão da página atual de contato;
- atualização de email e links sociais;
- CTA para convites, parcerias, eventos e imprensa;
- eventual bloco de newsletter, se fizer sentido para a estratégia.

#### Regras

1. A página de contato deve ser simples, clara e confiável.
2. Se o formulário persistir, ele deve continuar funcional e auditável.

## Modelo de informação recomendado

### Conteúdo administrável

Para evitar que tudo fique hardcoded, o ideal é introduzir uma camada editorial progressiva no sistema.

#### Fase inicial

Permitir conteúdo estático em arquivos e componentes para acelerar o rebrand e a publicação.

#### Fase seguinte

Criar coleções Mongo ou settings estruturados para:

- `siteContent`
- `projects`
- `events`
- `pages`
- `mediaAssets`

### Estrutura mínima sugerida

#### `siteContent`

- hero da home;
- textos institucionais curtos;
- CTAs principais;
- links sociais;
- blocos de destaque.

#### `projects`

- conteúdo do portfolio.

#### `events`

- agenda e arquivo de eventos.

#### `pages`

- conteúdo mais rico de `about`, `sarau-safado` e outras páginas editoriais.

## Estratégia técnica

### 1. Preservar arquitetura atual

Reaproveitar ao máximo:

- `src/app/(store)/page.tsx`
- `src/app/about/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/faq/page.tsx`
- `src/app/(store)/products/page.tsx`
- `src/app/(store)/product/[slug]/page.tsx`
- componentes de vitrine e catálogo já existentes.

### 2. Expandir rotas de conteúdo

Rotas prováveis:

- `/`
- `/about`
- `/projects`
- `/events`
- `/sarau-safado`
- `/contact`
- `/products`
- `/product/[slug]`

### 3. Não duplicar motor de catálogo

Produtos continuam vindo do fluxo atual com Stripe e agrupamento por `metadata.slug`.

Se houver necessidade de conteúdo editorial por produto, adicionar metadados ou lookup complementar em Mongo em vez de criar um segundo catálogo paralelo.

### 4. Media e imagens

Ativos editoriais devem seguir uma estratégia consistente:

- uso de `public/` para marca e ativos estáveis;
- uso de URLs gerenciadas para galerias e mídia dinâmica;
- compatibilidade com o preview administrativo quando a origem for remota.

### 5. Admin gradual

Nem tudo precisa nascer administrável já na primeira entrega.

Prioridade de admin:

1. links e textos institucionais básicos;
2. eventos;
3. projetos;
4. blocos da home;
5. páginas editoriais maiores.

## Fases de implementação

### Fase 1. Fundação de marca e arquitetura híbrida

#### Objetivo

Fazer o site deixar de parecer genérico e passar a comunicar claramente Selo Libertária, sem ainda modelar toda a camada editorial.

#### Entregas

- rebrand de metadata, navegação e footer;
- revisão da home para formato híbrido;
- revisão de `about` e `contact`;
- definição de estrutura visual e copy base;
- ligação clara entre home institucional e catálogo.

#### Critério de aceite

1. O site comunica Selo Libertária já na primeira dobra.
2. A loja continua navegável e comprável sem regressão.
3. O usuário entende que há livros, projetos e eventos no mesmo ecossistema.

### Fase 2. Camada editorial pública

#### Objetivo

Publicar as páginas que existem hoje no Wix dentro da base atual do projeto.

#### Entregas

- página `Projects`;
- página `Events`;
- página `Sarau Safado`;
- blocos de conteúdo editorial ligados à home e às páginas institucionais;
- integração visual com imagens e textos do selo.

#### Critério de aceite

1. O conteúdo principal do Wix passa a existir no novo site.
2. Todas as páginas têm navegação consistente com a loja.
3. As páginas editoriais podem levar a produtos, contato e eventos relacionados.

### Fase 3. Modelo administrável

#### Objetivo

Reduzir dependência de conteúdo hardcoded e permitir atualização contínua.

#### Entregas

- modelagem de coleções ou settings para conteúdo editorial;
- ações e telas mínimas de admin para eventos e projetos;
- fluxo de imagem associado;
- fallback seguro quando Mongo estiver indisponível.

#### Critério de aceite

1. Projetos e eventos podem ser atualizados sem editar código.
2. Build e runtime degradam com segurança quando uma coleção editorial falhar.
3. A storefront continua funcional mesmo com falha na camada editorial.

### Fase 4. Profundidade comercial-editorial

#### Objetivo

Conectar melhor narrativa e conversão.

#### Entregas

- produtos relacionados a eventos e projetos;
- destaques automáticos de agenda na home;
- contexto editorial em PDPs;
- possíveis coleções como `Livros sonoros`, `Lançamentos` ou `Obras relacionadas`.

#### Critério de aceite

1. Conteúdo editorial gera descoberta real de catálogo.
2. O funil de compra não fica mais confuso por causa das novas camadas.

## Diretrizes de UX e conteúdo

### Manter do produto atual

- estrutura de loja, carrinho, checkout e conta;
- grids de produto e PDPs já estabilizados;
- princípios de responsividade e acessibilidade;
- linguagem de componentes do sistema atual.

### Introduzir do Selo Libertária

- narrativa autoral;
- peso institucional e cultural;
- mais contexto sobre livros e projetos;
- destaque para eventos e Sarau Safado;
- identidade visual menos genérica e mais editorial.

### Cuidado importante

O redesign não deve transformar a loja em um site de festival sem compra clara, nem transformar o selo em um e-commerce frio sem contexto cultural.

## Riscos e decisões importantes

### 1. Hardcode excessivo

Se todo o conteúdo editorial entrar como texto fixo em componentes, a evolução futura ficará lenta.

Mitigação:

- aceitar algum hardcode na Fase 1;
- planejar desde já a migração para coleções editoriais.

### 2. Perda de foco comercial

Se a home virar apenas manifesto institucional, a loja perde conversão.

Mitigação:

- hero com CTA de compra;
- livros em destaque logo cedo;
- ligação constante entre conteúdo e catálogo.

### 3. Complexidade administrativa precoce

Se tentarmos tornar todos os blocos administráveis de imediato, a entrega atrasa.

Mitigação:

- priorizar páginas públicas primeiro;
- admin editorial progressivo depois.

### 4. Inconsistência de marca

Se rebrandar apenas a home e deixar emails, metadata ou contato genéricos, a experiência quebra.

Mitigação:

- revisar todos os pontos de marca na Fase 1.

## Critérios globais de aceite

1. O projeto deixa de parecer um starter genérico e passa a comunicar Selo Libertária de forma consistente.
2. A loja atual continua íntegra, sem regressão em catálogo, carrinho, checkout, conta e admin.
3. O conteúdo principal do site atual em Wix passa a existir dentro da nova estrutura.
4. Navegação institucional e navegação comercial convivem de forma clara.
5. O site final parece uma plataforma híbrida de editora, autora e loja, e não duas experiências coladas sem coerência.

## Próxima implementação recomendada

Ordem de execução sugerida:

1. rebrand estrutural de home, metadata, footer e páginas institucionais existentes;
2. criação das páginas `Projects`, `Events` e `Sarau Safado`;
3. adaptação da home para destacar livros + agenda + narrativa do selo;
4. modelagem da camada editorial administrável;
5. integração mais profunda entre catálogo e conteúdo cultural.
