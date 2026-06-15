# Overview do site atual

## Visão geral

O projeto atual está organizado em quatro camadas principais:

1. Storefront público
2. Camada editorial pública
3. Backoffice administrativo
4. Infraestrutura e fluxos de suporte

## 1. Storefront público

### Já existe

- Home pública em linguagem editorial
- Catálogo de produtos
- Página de produto
- Categorias
- Busca
- Carrinho
- Checkout transparente com Stripe
- Login
- Cadastro
- Área do usuário
- Pedidos do usuário
- Favoritos
- Métodos de pagamento salvos

### Observações

- A arquitetura principal de loja está funcional.
- O catálogo continua sendo a espinha comercial do projeto.
- A home já mistura catálogo com narrativa editorial.

## 2. Camada editorial pública

### Rotas públicas existentes

- `/`
- `/about`
- `/contact`
- `/events`
- `/projects`
- `/sarau-safado`
- `/faq`
- `/terms`
- `/privacy`

### Superfícies editoriais existentes

- Home editorial
- Sobre
- Contato
- Eventos
- Projetos
- Sarau Safado

## 3. Backoffice administrativo

### Áreas existentes no admin

- Dashboard
- Editorial
- Produtos
- Categorias
- Pedidos
- Usuários
- Promoções
- Settings
- Emails
- Templates de email
- Webhooks

### Hub editorial existente

- `/admin/editorial`
- `/admin/editorial/home`
- `/admin/editorial/about`
- `/admin/editorial/contact`
- `/admin/editorial/events`
- `/admin/editorial/projects`
- `/admin/editorial/sarau-safado`

## 4. Infraestrutura e fluxos de suporte

### Já existe

- MongoDB para conteúdo, promoções, usuários, pedidos, logs e configurações
- Stripe para catálogo, pagamento e métodos salvos
- Webhooks Stripe persistidos
- Sistema de emails com log administrativo
- Auth própria com sessão em Mongo/cookie
- Configuração regional e de idioma no admin
- Sistema de frete com providers configuráveis
- Promoções e cupons em Mongo

## Estado de conexão entre admin e páginas públicas

## Conectado corretamente

### Home

- Hero da home
- Manifesto da home
- Bloco `author`
- Bloco `community`
- Destaque editorial de programação usando conteúdo de `sarau-safado` e `events`

### About

- Hero
- Seção principal
- Cards
- Bloco de fechamento

### Contact

- Hero
- Bloco do formulário
- Canais diretos
- Links de navegação

### Events

- Lista pública consumindo os eventos do conteúdo editorial
- Filtro por `published`
- Ordem vinda do conteúdo salvo

### Projects

- Lista pública consumindo os projetos do conteúdo editorial
- Filtro por `published`
- Ordem vinda do conteúdo salvo

### Sarau Safado

- Hero
- Imagem de hero
- Bloco `why`
- `signals`
- `programNotes`
- Links de continuidade

## Parcialmente conectado

### Events

- O admin já aceita imagem principal do evento.
- A listagem pública ainda pode aproveitar melhor essa imagem no layout.
- Ainda há copy fixa em partes auxiliares da página.

### Projects

- O admin já aceita imagem principal do projeto.
- A página pública ainda não explora essa mídia com o mesmo peso visual disponível no backoffice.
- Ainda há blocos institucionais laterais e finais com conteúdo estático.

### Home

- A home já puxa mais conteúdo dinâmico do admin, mas ainda mistura partes vindas de tradução, fallback e conteúdo editorial salvo.
- O bloco de newsletter continua funcional, mas não substitui um eventual CTA editorial mais rico se isso virar requisito.

## Pontos que ainda merecem revisão

### Revisão de aderência visual

- Verificar se `events` deve exibir imagem de capa por item.
- Verificar se `projects` deve exibir imagem de capa por item.
- Verificar se a home deve ter mais blocos 100% administráveis além dos já existentes.

### Revisão de aderência editorial

- Confirmar se todo texto importante da home deve sair do admin ou se parte continua no i18n.
- Confirmar se blocos institucionais secundários de `events` e `projects` devem virar conteúdo administrável.
- Confirmar se `faq`, `terms` e `privacy` entram ou não no mesmo circuito editorial do Mongo no futuro.

### Revisão operacional

- Validar no uso real se a equipe do admin entende claramente o que altera cada bloco público.
- Conferir se todos os campos salvos no admin têm reflexo visível no storefront.
- Evitar criar novos campos editoriais no admin sem saída pública correspondente.

## Lista resumida do que faltava e foi conectado agora

- Renderização pública do bloco `author` da home com conteúdo do admin
- Renderização pública do bloco `community` da home com corpo, CTA principal e links secundários
- Destaque editorial da home usando conteúdo ativo de `sarau-safado` e `events`

## Próximos passos sugeridos

1. Conectar visualmente as imagens de `events` na página pública.
2. Conectar visualmente as imagens de `projects` na página pública.
3. Revisar `events` e `projects` para reduzir textos estáticos que hoje ainda não vêm do admin.
4. Fazer uma auditoria campo a campo do hub editorial para garantir que tudo que é salvo aparece no site.
