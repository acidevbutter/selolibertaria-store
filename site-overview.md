# Overview do site atual — Selo Libertária

## Visão geral

O projeto atual está organizado em quatro camadas:

1. storefront público;
2. camada editorial pública;
3. backoffice administrativo;
4. infraestrutura e fluxos de suporte.

## 1. Storefront público

Já existe:

- Home pública em linguagem editorial.
- Catálogo de produtos/livros.
- Página de produto/PDP.
- Categorias.
- Busca.
- Carrinho.
- Checkout transparente com Stripe.
- Login e cadastro.
- Área do usuário.
- Pedidos do usuário.
- Favoritos.
- Métodos de pagamento salvos.

Observação: a arquitetura principal de loja está funcional e deve ser preservada.

## 2. Camada editorial pública

Rotas públicas documentadas no projeto:

```text
/
/about
/contact
/events
/projects
/sarau-safado
/faq
/terms
/privacy
```

Superfícies editoriais:

- Home editorial.
- Sobre.
- Contato.
- Eventos.
- Projetos.
- Sarau Safado.

## 3. Backoffice administrativo

Áreas existentes:

- Dashboard.
- Editorial.
- Produtos.
- Categorias.
- Pedidos.
- Usuários.
- Promoções.
- Settings/Configurações.
- Emails.
- Modelos de email.
- Webhooks.

Hub editorial existente:

```text
/admin/editorial
/admin/editorial/home
/admin/editorial/about
/admin/editorial/contact
/admin/editorial/events
/admin/editorial/projects
/admin/editorial/sarau-safado
```

## 4. Infraestrutura e suporte

Já existe:

- MongoDB para conteúdo, promoções, usuários, pedidos, logs e configurações.
- Stripe para catálogo, pagamento e métodos salvos.
- Webhooks Stripe persistidos.
- Sistema de emails com log administrativo.
- Auth própria com sessão em Mongo/cookie.
- Configuração regional e de idioma no admin.
- Sistema de frete com providers configuráveis.
- Promoções e cupons em Mongo.

## Estado de conexão entre admin e páginas públicas

### Conectado corretamente

Home:

- Hero.
- Manifesto.
- Bloco de autora/curadoria.
- Bloco de comunidade/continuidade.
- Destaque editorial usando conteúdo de Sarau Safado e eventos.

About:

- Hero.
- Seção principal.
- Cards.
- Fechamento.

Contact:

- Hero.
- Formulário.
- Canais diretos.
- Links de continuidade.

Events:

- Lista pública a partir do conteúdo editorial.
- Filtro por `published`.
- Ordem vinda do conteúdo salvo.

Projects:

- Lista pública a partir do conteúdo editorial.
- Filtro por `published`.
- Ordem vinda do conteúdo salvo.

Sarau Safado:

- Hero.
- Imagem de hero.
- Bloco `why`.
- `signals`.
- `programNotes`.
- Links de continuidade.

### Parcialmente conectado / revisar

Events:

- Admin já aceita imagem principal.
- Listagem pública ainda pode usar melhor essa imagem.
- Ainda pode existir copy fixa auxiliar.

Projects:

- Admin já aceita imagem principal.
- Página pública ainda pode explorar essa mídia com mais peso.
- Ainda pode existir conteúdo institucional lateral/final fixo demais.

Home:

- Já puxa conteúdo dinâmico, mas mistura conteúdo salvo, fallback e i18n.
- Validar se tudo que o admin salva aparece de forma clara no público.

## Menu público atual

Usar visualmente:

```text
Livros
Projetos
Sarau Safado
Sobre
Contato
```

Não forçar mudança de rota sem tarefa específica. Ajustar labels e links de forma segura.

## Próximos passos reais

1. Auditar menu/header/footer e copy pública em `pt-BR`.
2. Alinhar a Home ao Figma Editorial V2.
3. Melhorar uso visual das imagens de `events` e `projects`.
4. Revisar páginas institucionais para reduzir copy fixa e fortalecer ritmo editorial.
5. Auditar campo a campo o hub editorial: tudo que salva precisa aparecer no site.
6. Revisar PDP/livro sem quebrar Stripe/catalog/cart.
7. QA mobile, acessibilidade, build e reload direto.
## Addendum — P3.75B

Conexões novas da camada editorial pública:
- `/projects` usa `page_projects` para hero, nota curatorial, listagem e faixa final.
- `/products` usa `page_products` para hero, nota curatorial, vazio editorial e faixa final.
- `/product/[slug]` usa `page_product` nos blocos editoriais, preservando labels técnicos hardcoded.
- Newsletter e footer usam `site_global`.
