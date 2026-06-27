# Product Implementation Spec — Selo Libertária

## Objetivo

Implementar e consolidar a identidade do Selo Libertária dentro de uma storefront/admin já funcional, preservando a arquitetura existente de comércio e acoplando a ela conteúdo institucional, editorial e cultural.

O objetivo **não** é trocar a loja por um site institucional. O objetivo é uma plataforma híbrida.

## Princípio central

Manter a espinha dorsal de comércio sem quebrar:

- catálogo por produto e variante;
- PDP/página de produto;
- carrinho;
- checkout Stripe;
- conta de cliente;
- favoritos;
- promoções;
- admin de produtos, pedidos, emails e webhooks.

Sobre essa base, aplicar:

- narrativa autoral;
- peso institucional e cultural;
- livros e publicações como centro visual;
- eventos, projetos e Sarau Safado como camada viva;
- identidade Editorial V2.

## Idioma do produto

O Selo Libertária opera somente em `pt-BR` neste momento.

Regras:

- o storefront público deve renderizar sempre em português do Brasil;
- o admin deve manter labels operacionais em português do Brasil;
- conteúdo editorial editável deve vir do admin/Mongo quando a superfície já estiver conectada;
- `Accept-Language`, cookie de locale e prefixos de locale não devem definir idioma público;
- prefixos legados de locale devem apenas redirecionar para a rota canônica sem prefixo.

## Visão de produto

O site funciona em dois modos complementares:

### 1. Modo loja

- Comprar livros/produtos.
- Explorar catálogo.
- Ver detalhes de livros.
- Favoritar.
- Carrinho.
- Checkout.
- Pedidos e conta.

### 2. Modo editorial-cultural

- Conhecer o selo.
- Conhecer Natália Nolli Sasso e a curadoria.
- Explorar projetos.
- Ver agenda/acervo de eventos.
- Entrar no universo do Sarau Safado.
- Entrar em contato e acompanhar redes/newsletter.

A loja deve levar ao universo editorial. O editorial deve levar ao catálogo.

## Menu público oficial

```text
Livros
Projetos
Sarau Safado
Sobre
Contato
```

Regras:

- `Comprar` é CTA, não item de menu.
- `Eventos` continua como rota/conteúdo, mas não item principal do menu.
- `FAQ`, `Termos` e `Privacidade` ficam como navegação auxiliar/footer.
- Não renomear rotas técnicas sem tarefa explícita de SEO/redirects.

## Diretriz ativa de redesign

A direção ativa é **Editorial V2**, uma leitura clara de **Editorial Noturno**.

Usar:

- `#F7F4EF` papel;
- `#0B0B0B` preto profundo;
- `#7A1E22` vinho seco;
- `#D8D0C4` bege envelhecido;
- capas grandes;
- serifas/tipografia editorial;
- whitespace forte;
- bordas retas;
- CTA comercial clara.

Evitar:

- starter genérico;
- SaaS visual no público;
- e-commerce frio;
- festival/site institucional sem compra clara;
- excesso de blocos antes do footer na Home Figma V2;
- hardcode excessivo sem fallback/admin quando a superfície já é administrável.

## Home — escopo visual atual

A Home deve seguir, quando o foco for Figma V2:

1. Header.
2. Hero preto/papel com capa dominante e CTA de compra.
3. Manifesto.
4. Livro em destaque.
5. Catálogo curto.
6. Sarau Safado.
7. Newsletter/footer.

A primeira dobra deve responder:

- o que é o Selo Libertária;
- o que posso comprar/explorar;
- por que essa marca é diferente.

## Páginas editoriais existentes

Não criar do zero sem necessidade. Melhorar as superfícies existentes:

- `/projects`
- `/events`
- `/sarau-safado`
- `/about`
- `/contact`

Cada página deve ter:

1. entrada/hero forte;
2. bloco curatorial ou texto de contexto;
3. listagem/conteúdo principal;
4. continuidade para catálogo, Sarau, projetos, contato ou newsletter.

## PDP / Página de livro

A PDP precisa preservar compra clara no topo:

- capa/galeria;
- título;
- autora;
- preço/status;
- variantes, se existirem;
- comprar/adicionar ao carrinho;
- favorito.

Abaixo da dobra, adicionar contexto editorial quando possível:

- sinopse;
- trecho;
- ficha técnica;
- relação com projetos/Sarau/eventos;
- livros relacionados.

## Admin editorial

O admin editorial já existe e deve ser auditado/fortalecido, não recriado.

Critérios:

- tudo que é salvo no admin precisa ter reflexo público claro;
- eventos/projetos devem aproveitar imagem principal publicamente;
- Sarau Safado deve usar hero image como capa de abertura;
- home deve deixar claro quais blocos são administráveis e quais vêm de catálogo/eventos/projetos;
- não mover conteúdo editorial para `settings`.

## Riscos

### 1. Perda de foco comercial

Mitigação:

- hero com CTA de compra;
- livros cedo na Home;
- PDP forte;
- conteúdo editorial sempre com caminho para catálogo.

### 2. Projeto virar só redesign visual

Mitigação:

- validar build;
- preservar Stripe/Mongo/auth;
- não quebrar cart/checkout/account.

### 3. Rotas quebradas por troca apressada

Mitigação:

- manter rotas existentes;
- localizar labels;
- planejar aliases/redirects separadamente.

### 4. Fork residue

Mitigação:

- remover marcas antigas, starter copy e placeholders visíveis quando tocar a superfície;
- manter código funcional quando o nome antigo for detalhe interno não visível.

## Critérios globais de aceite

1. O produto comunica Selo Libertária claramente.
2. A loja continua íntegra.
3. O menu público é coerente.
4. O site não mistura inglês e português sem intenção.
5. O conteúdo editorial e a compra convivem sem parecer duas experiências coladas.
6. Admin e público permanecem conectados.
7. Build/lint/test são executados ou reportados com falha explícita.
