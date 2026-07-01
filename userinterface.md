# User Interface — Selo Libertária

## Fonte canônica

Este arquivo resume decisões visuais rápidas. Para regras completas, usar `UI_UX_PATTERNS.md`. Para escopo de produto, usar `spec.md`.

## Direção visual

Direção ativa: **Editorial V2**.

Base:

```text
Papel: #F7F4EF
Preto: #0B0B0B
Vinho seco: #7A1E22
Bege envelhecido: #D8D0C4
```

Sensação:

- livraria-editora cultural contemporânea;
- adulto, literário, quente e autoral;
- livro impresso virando experiência digital;
- contraste forte;
- muito respiro;
- capas grandes;
- bordas retas.

Evitar:

- template ecommerce genérico;
- dashboard SaaS no público;
- visual infantil;
- sex-shop óbvio;
- excesso de vermelho;
- assets herdados de fork sem relação com a marca.

## Header público

Menu oficial:

```text
Livros
Projetos
Sarau Safado
Sobre
Contato
```

Elementos:

- marca/wordmark à esquerda;
- menu principal curto;
- CTA final orientada à sessão: `Entrar`, `Conta` ou `Minha conta`;
- ações de loja, se já existirem: busca, conta, favoritos, carrinho.

## Home

Ordem visual recomendada para Figma Editorial V2:

1. Header.
2. Hero escuro/papel com capa dominante.
3. Manifesto claro e respirado.
4. Livro em destaque.
5. Catálogo curto com três capas/cards.
6. Sarau Safado em painel forte.
7. Newsletter/Footer.

## Botões

Primários:

- `Comprar livro`
- `Comprar agora`
- `Adicionar ao carrinho`
- `Assinar`

Secundários:

- `Ler trecho`
- `Conhecer o selo`
- `Ver livro`
- `Ver projetos`
- `Ver agenda`

Evitar:

- `View`
- `Browse`
- `Read more`
- `Open`
- `Details`

## Cards

### Livro

- capa protagonista;
- título maior que preço/meta;
- autora/status/preço;
- CTA clara;
- canto externo reto;
- hover sutil;
- altura consistente.

### Projeto / Evento

- imagem quando houver;
- título;
- período/local/status;
- resumo curto;
- CTA específica: `Ver projeto`, `Ver evento`, `Ver agenda`.

## Sarau Safado

Hero:

- imagem de fundo se cadastrada;
- gradiente/bloco de leitura;
- título grande;
- texto curto;
- CTA de agenda/continuidade.

## Footer

Manter:

- copyright;
- métodos de pagamento quando aplicável;
- newsletter;
- links auxiliares;
- crédito de desenvolvimento discreto, se existir.

Links legais no footer:

- Perguntas frequentes
- Termos
- Privacidade

## Admin UI

Visual:

- sidebar preta;
- conteúdo papel;
- cards retos;
- hero curto;
- painéis claros;
- acento vinho.

Copy:

- `Painel`, não `Dashboard`, quando a tela estiver em `pt-BR`.
- `Configurações`, não `Settings`.
- `Modelos de email`, não `Email Templates`.
- `Ver pedido`, não `Abrir`.
- `Salvar livro`, não `Salvar` genérico quando houver ambiguidade.

## Responsivo

Validar:

- 390px;
- 768px;
- 1024px;
- 1440px.

Sem overflow horizontal. Menu mobile precisa abrir/fechar e manter os cinco itens principais.

## Atualização 2026-06-24

- Header e menu mobile devem repetir exatamente os cinco itens oficiais, sem `Início`, sem `Eventos` e sem categorias dinâmicas no bloco principal.
- CTA `Comprar` continua separada da navegação principal em desktop e mobile.
- Busca, catálogo e estados vazios públicos devem preferir `livros` no lugar de `produtos` quando o contexto for storefront editorial.
- Catálogo, Projetos, Sarau Safado, Sobre e Contato devem repetir a gramática visual do Figma Editorial V2: hero dominante, poucas seções, alternância entre papel e preto e fechamento único antes do footer.
- Na PDP, a capa deve liderar a primeira dobra, com bloco de compra enxuto à direita, botões retos de `Comprar` e `Ler trecho`, sinopse com leitura confortável e faixa preta para trecho/citação.
- O CTA final do header público deve ser `Entrar` ou `Conta`/`Minha conta`; `Comprar` não deve aparecer no header.
- Em fases de estabilização pública, o locale renderizado do storefront pode ser congelado em `pt-BR` sem desmontar a infraestrutura de i18n.
- A página `/events` deve seguir a composição de agenda editorial: hero escuro com pôsteres empilhados, nota curatorial em duas colunas, linhas de agenda, arquivo/memória e CTA final única.

## Atualização 2026-06-25

- O produto agora assume `pt-BR` fixo como contrato visual e textual em todas as superfícies públicas e no shell do admin.
- Não deve existir seletor visível de idioma no público, nem variação de labels por navegador, cookie ou prefixo legado.
- Qualquer fallback visual ou textual novo precisa nascer em português do Brasil.
## Addendum — Copy administrável

- Home, Eventos, Projetos, Livros, Página do livro, Sobre, Contato, newsletter e footer agora seguem a fonte editorial do admin quando aplicável.
- Labels técnicos recorrentes permanecem fixos para não transformar a interface em um formulário de configuração excessivo.

## Atualização 2026-06-29

- Em `/admin/settings`, o bloco de frete deve mostrar um único painel fixo do Melhor Envio, sem lista genérica de provedores, sem CTA de adicionar provedor e sem presets visíveis de Correios, Jadlog, EasyPost ou HTTP customizado.
- Nesse painel, o token permanece fora da interface; a UI expõe apenas toggle operacional, ambiente, URL base, CEP de origem, medidas padrão, `User-Agent`, e-mail técnico e campos fixos de `BR` e `Exige CEP`.

## Atualização 2026-06-30

- No header público, o carrinho deve aparecer como ícone compacto, sem rótulo textual visível no desktop.
- No mobile, o carrinho do header pode coexistir com um atalho flutuante editorial e mínimo quando já houver itens no carrinho.
- Na grade de livros, a combinação visual preferida para compra rápida é `Adicionar ao carrinho` como ação secundária e `Comprar` como CTA principal.
## Atualização 2026-06-30 — checkout convidado

- Em `/checkout`, o topo do formulário deve usar o título `Dados para sua compra`, helper curto sobre criação automática de conta e CTA final `Finalizar compra`.
- Para pessoa autenticada, as escolhas de entrega no checkout devem priorizar `Usar meu endereço salvo`, `Usar um novo endereço` e `Retirar na loja`, sem introduzir múltiplos endereços salvos nesta etapa.

## Atualização 2026-07-01
- Enquanto a operação comercial for apenas nacional, cadastro, conta e checkout devem fixar o país em `Brasil/BR`, sem seletor de outros destinos nas superfícies tocadas.
- Nessas superfícies `BR-only`, o país não deve aparecer como campo desabilitado; a UI deve remover esse campo e manter só a mensagem curta sobre atendimento exclusivo no Brasil.
- Em `/admin/settings`, o bloco fixo do Melhor Envio deve mostrar somente status seguro da conexão, helper de transição para OAuth e CTA `Conectar Melhor Envio` desabilitada como `Em breve`, sem exibir segredo técnico.
- No formulário público de checkout, `CPF` e `Telefone` devem usar máscara progressiva enquanto a pessoa digita; erros de buyer ficam curtos, abaixo do campo correspondente e sem transformar o bloco `Dados para sua compra` em uma parede de alertas.
- Em `/products`, a primeira seção de `Livros` deve abrir em fundo preto editorial, com capa deslocada à direita, citação em papel sobreposta e CTA `Ver catálogo` apontando para a grade publicada da própria página.
- Na grade pública de livros, mesmo com um único título, cada card deve manter largura editorial controlada, proporção estável de capa e CTAs visíveis, sem alongamento horizontal nem grandes vazios laterais.
