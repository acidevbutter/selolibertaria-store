# AGENTS.md — Selo Libertária

This file guides Codex when working in this repository.

## Project identity

This repository is an inherited storefront/admin codebase that is being rebranded and adapted into **Selo Libertária**.

Treat all older storefront names, demo brands, starter examples, placeholder products, previous-site references and generic fork residue as legacy unless they are still required by code. New work should converge toward Selo Libertária.

## Product summary

Selo Libertária is not a pure brochure site and not a cold generic ecommerce store. It is a hybrid platform:

1. **Storefront** — books/products, catalog, PDP, cart, checkout, account, favorites and orders.
2. **Editorial layer** — home, about, contact, events, projects and Sarau Safado.
3. **Admin/backoffice** — dashboard, editorial hub, products, categories, orders, users, promotions, settings, emails, email templates and webhooks.
4. **Infrastructure/support flows** — MongoDB, Stripe, auth/session, shipping providers, email logs and webhooks.

Preserve the working commerce/admin architecture. Do not replace the app with static institutional pages.

## Development commands

Use Yarn Classic.

```bash
yarn install

yarn dev

yarn build
yarn start

yarn lint
yarn test
tsgo
```

Notes:

- Keep the package manager on Yarn Classic.
- Keep existing Next.js/App Router conventions.
- Keep Stripe and Mongo integrations server-safe.
- Do not introduce a second lockfile.
- When build/dev hangs, clear `.next/` before assuming application logic is broken.

## Current canonical public menu

The public header menu must be:

```text
Livros
Projetos
Sarau Safado
Sobre
Contato
```

Rules:

- `Comprar` is a CTA, not a menu item.
- `Eventos` may exist as a route/content area, but it is not a primary menu item.
- `FAQ`, `Termos` and `Privacidade` may appear in the footer or legal navigation, not in the main menu.
- Admin-only terms such as Dashboard, Pedidos, Mídia, Emails and Settings must never leak into the public menu.

## Route policy

Do not aggressively rename routes without a dedicated routing/SEO task.

Current route labels may be localized while preserving existing route paths. For example:

- `Livros` can point to the current catalog/products route.
- `Projetos` can point to `/projects`.
- `Sarau Safado` can point to `/sarau-safado`.
- `Sobre` can point to `/about`.
- `Contato` can point to `/contact`.

Only add aliases such as `/livros`, `/projetos`, `/sobre` and `/contato` if the task explicitly asks for redirect/canonical work.

## Visual direction

The active design direction is **Editorial V2**, a clearer implementation of **Editorial Noturno**.

Use:

- paper: `#F7F4EF`
- deep black: `#0B0B0B`
- dry wine: `#7A1E22`
- aged beige: `#D8D0C4`
- graphite/support darks when needed

The site should feel like a contemporary literary publisher/bookstore: adult, warm, cultural and editorial. Avoid:

- generic SaaS/dashboard look on public pages;
- childish, cute or pop visual language;
- sex-shop clichés;
- excessive ornamental effects;
- unrelated starter/demo assets.

## Figma guidance

Figma Prototype V2 is a visual reference, especially for:

- Home Desktop;
- Mobile Home;
- Book/PDP page;
- Admin editorial shell direction.

Do not copy absolute Figma-generated code. Translate the reference into reusable project components.

For the public home, prioritize:

1. Header
2. Hero with dominant book cover
3. Manifesto
4. Featured book section
5. Short catalog grid
6. Sarau Safado panel
7. Newsletter/footer

Avoid adding many extra blocks before the footer when the task is strict Figma fidelity.

## Public storefront rules

- Public copy for Selo Libertária should be `pt-BR` by default.
- Translate visible labels, placeholders, aria labels, empty states, loading states and errors when working on public localization.
- Do not auto-translate content authored in the admin; treat it as source content.
- Preserve catalog, cart, checkout, account and favorites.
- Books/products remain commerce entities; editorial content should contextualize them, not replace them.

## Editorial content rules

The editorial layer is already first-class and should not be recreated from scratch.

Existing editorial surfaces include:

- home
- about
- contact
- events
- projects
- sarau-safado

Admin editorial surfaces should follow the established pattern:

- store + fallback;
- admin form;
- publication/order metadata;
- public revalidation;
- safe fallback if Mongo is unavailable.

Do not move editorial collections into global `settings`. Keep events, projects and page content semantically separate.

## Admin rules

The admin should feel like an editorial backoffice, not a generic SaaS clone:

- fixed black sidebar;
- paper-like main surface;
- short hero/context per page;
- straight cards/panels;
- subtle wine accents;
- tables and forms with operational clarity.

Preserve existing queries, permissions and server actions. When updating legacy admin pages, wrap and polish before rewriting behavior.

Admin copy should be operational and clear. Prefer `Painel`, `Produtos`, `Pedidos`, `Usuários`, `Promoções`, `Configurações`, `Emails`, `Modelos de email`, `Webhooks` and `Editorial` over mixed English labels.

## Upload rules

For editorial/admin uploads:

- file picker first;
- local preview;
- confirmation modal with `Salvar` and `Descartar`;
- mode-aware behavior: `instant` vs `on-submit`;
- persist final URL only after the intended save/upload step.

For Sarau Safado hero image:

- one hero image only;
- replacing the image should replace the previous hero media, not build a gallery;
- public page should use it as a background/cover with contrast protection.

## Localization and currency

- Public Selo Libertária copy defaults to `pt-BR`.
- During public QA or temporary deploy stabilization, it is acceptable to force `pt-BR` at the locale resolver as long as the i18n architecture, message files and types remain intact.
- Keep i18n architecture intact; do not hardcode locale where the app already resolves it.
- Do not expose raw API errors to users if a local translated message/code exists.
- Admin and storefront dates/currency should respect the resolved locale and environment currency.
- Do not add a general currency selector unless the task explicitly concerns multi-currency support.

## Safety against fork residue

When touching files, remove or replace visible residue from previous forks/starter sites when it is in scope:

- old brand names;
- demo product names such as generic T-shirt/poster examples;
- placeholder metadata;
- starter slogans;
- unrelated store copy;
- duplicated/obsolete locale files;
- raw English labels in `pt-BR` surfaces.

Do not remove functional code only because a name is old. First verify whether it is visible copy, metadata, asset reference, or required implementation detail.

## Validation checklist

Before closing a task, run what is available:

```bash
yarn lint
yarn test
yarn build
tsgo
```

If a command is unavailable or hangs, report it explicitly with the last useful output.

Also validate:

- public menu labels;
- direct route reloads;
- mobile header/menu;
- no horizontal overflow;
- CTA behavior;
- checkout/cart untouched unless the task targets them;
- admin forms still save;
- no visible fork/demo residue in touched surfaces.

## AI patterns

- 2026-06-24: public navigation must stay identical across desktop and mobile with only `Livros`, `Projetos`, `Sarau Safado`, `Sobre` and `Contato`; keep `Comprar` as a separate CTA and never leak `Eventos`, `Início` or dynamic categories into the primary public menu.
- 2026-06-24: when polishing public storefront copy, prefer `livros` over generic `produtos` in search, catalogue and empty-state labels, and route fallback CTAs toward primary editorial surfaces such as `Projetos` instead of promoting `Eventos` in the main navigation path.
- 2026-06-24: public editorial pages after Home should follow the Editorial V2 hierarchy of one dominant hero, one short explanatory band, a concise content block and a single strong closing CTA strip before the newsletter/footer; avoid stacking many generic panels.
- 2026-06-24: in the public header, the final CTA must be session-oriented (`Entrar`, `Conta` or `Minha conta`) and never `Comprar`; purchase language belongs to product and catalog surfaces, especially the PDP.
- 2026-06-24: the PDP should read like a product page with editorial weight: cover-led hero, compact buy box, synopsis above the fold, dark excerpt band, factual technical details only, and related products with clear `Ver produto` continuity.
- 2026-06-25: when the public deploy drifts into `en-US`, freeze locale resolution at the server boundary instead of deleting i18n; cookies, `Accept-Language` and old locale prefixes may keep existing redirects, but the rendered storefront should stay in `pt-BR`.
- 2026-06-25: `/events` should behave like an editorial agenda page, not a grid of generic cards: full-width dark hero, curatorial note, horizontal agenda rows, archive/memory cards and one closing continuity strip before the footer.
- 2026-06-25: the locale contract is now `pt-BR` only across storefront and admin shell; ignore `Accept-Language`, ignore locale cookies, collapse legacy `/en`, `/en-us`, `/es` and `/pt-br` prefixes into canonical routes, and never reintroduce public English fallback copy.
- 2026-06-28: nos formulários do admin editorial, prefira labels contextuais por seção e helpers curtos para campos ambíguos como CTA, slug, ordem e mídia; após salvar copy estrutural, mantenha um feedback persistente de sucesso visível no próprio formulário.
- 2026-06-28: nas telas de copy do admin editorial, use seções recolhíveis com a primeira seção principal aberta por padrão e blocos secundários recolhidos por padrão para reduzir formulários longos sem alterar save, validação ou nomes de campo.
- 2026-06-28: no fechamento de pedidos, preserve no registro final o snapshot de entrega escolhido no checkout com `deliveryMethod`, endereço essencial e cotação mínima de frete; no admin, a leitura desse bloco deve ser opcional para manter compatibilidade com pedidos legados.
- 2026-06-28: adapters novos de frete devem entrar só no servidor, reaproveitando o contrato existente de `ShippingQuote` e `ShippingRate`, sem expor credenciais no cliente, sem alterar checkout/admin UI e com falha segura em mensagem normalizada quando a transportadora externa nao responder.
- 2026-06-28: ao adicionar um novo provedor de frete no admin, preserve o padrão atual de presets e segredo criptografado em `credentialsEncrypted`; para Melhor Envio, trate a configuração como cotação-only, com token manual e sem refresh automático antes da PR 3B.
- 2026-06-28: no admin de configurações do Selo Libertária, exponha apenas o preset configurável de frete do Melhor Envio; presets legados podem aparecer só para remoção e nunca devem ser recriados automaticamente após exclusão.
- 2026-06-28: quando o frete do Selo Libertária depender só do Melhor Envio, mantenha a configuração técnica exclusivamente em variáveis de ambiente e deixe no admin apenas um toggle operacional de ativar ou pausar a cotação.
- 2026-06-28: no checkout com CEP brasileiro, se houver Melhor Envio habilitado, prefira a cotação dele no servidor e escolha internamente apenas o menor serviço válido, mantendo `pickup` intacto e reutilizando o fluxo atual de erro quando a cotação falhar.
- 2026-06-29: ao documentar o Melhor Envio em arquivos de ambiente do Selo Libertária, mantenha apenas segredos em `env`, com `MELHOR_ENVIO_ACCESS_TOKEN` como chave ativa atual e opções operacionais fora do `.env.example`.
- 2026-06-29: no Selo admin, o frete deve aparecer como um único bloco fixo do Melhor Envio: segredo/token apenas em `env`, opções operacionais em `current.shippingMelhorEnvio`, `shippingEnabled` separado e `shippingProviders` preservado só como legado invisível para fallback.

@RTK.md
## Addendum — P3.75B

- copy pública editorial e comercial deve sair de documentos editoriais dedicados no Mongo/admin; não recolocar esses textos em `messages/pt-BR.json`.
- labels técnicos repetidos da vitrine e da PDP permanecem hardcoded em pt-BR mesmo quando a página recebe blocos editoriais do admin.
- migrations editoriais em produção devem apenas criar documentos novos e preencher paths ausentes; `--force` fica manual e nunca como comportamento padrão.

## AI patterns addendum — 2026-06-30

- no storefront do Selo Libertária, o carrinho deve ficar sempre acessível como ícone compacto no header público e, no mobile, pode ganhar um atalho flutuante apenas quando já houver itens no carrinho; `Carrinho` e `Comprar` nunca entram no menu principal.
- nos cards de catálogo público, mantenha `Adicionar ao carrinho` como ação de permanência na página com atualização de badge e reserve `Comprar` para fluxo de compra imediata com redirecionamento ao checkout; se a seleção segura de variante não existir, prefira levar à PDP em vez de adicionar cegamente.
- no checkout público do Selo Libertária, visitante com carrinho válido deve entrar direto em `/checkout` sem login prévio, vendo o bloco `Dados para sua compra` com copy de criação automática de conta e sem qualquer barreira de confirmação de e-mail antes do pagamento.
- após um pedido concluído no checkout convidado, o acesso inicial à conta deve acontecer por magic link expirável enviado por e-mail, vinculado ao usuário e ao pedido, com redirecionamento para `Compras` e CTA explícito para criação de senha quando a conta ainda não tiver senha definida.
- 2026-07-01: no checkout, no cadastro e na edição de endereço da conta, o país deve ficar travado em `Brasil/BR` enquanto a operação do selo for nacional; após um CEP brasileiro válido preencher o endereço no checkout, a cotação de frete deve disparar automaticamente e, no admin, o bloco do Melhor Envio pode expor apenas status seguro do token de ambiente com CTA OAuth marcada como `Em breve`, sem revelar segredos.
- 2026-07-01: quando o fluxo de endereço estiver em modo `BR-only`, não renderize um campo de país desabilitado; esconda o campo por completo e mantenha apenas uma mensagem curta informando que a entrega atende somente endereços no Brasil.
- 2026-07-01: no checkout transparente com Stripe, a chave de idempotência da criação do `PaymentIntent` deve refletir os parâmetros reais que podem mudar entre tentativas, como total, frete e destino; não reutilize uma key baseada apenas em `checkoutOwnerKey/cartHash` quando a requisição já não é semanticamente a mesma.
- 2026-07-01: no adapter de cotação do Melhor Envio, trate qualquer serviço retornado com preço válido como elegível, mesmo quando o código ou o nome não fizer parte de uma lista conhecida; preserve `serviceCode`, `serviceName`, priorize `custom_price` e `custom_delivery_time` quando existirem e deixe `Registro Módico`, `Impresso`, `Impresso Normal` e equivalentes participarem normalmente da seleção do menor frete.
- 2026-07-01: no checkout público do Selo Libertária, os campos da pessoa compradora devem validar cedo e formatar enquanto a pessoa digita, especialmente `CPF` e `Telefone`; normalize nome e e-mail no blur, exiba mensagens curtas por campo e não deixe o submit seguir quando os dados básicos da compra estiverem inválidos.
- 2026-07-01: em projetos com Yarn Classic e hooks Git via Husky, o `prepare` deve falhar com segurança quando `devDependencies` não estiverem instaladas; mantenha a instalação automática dos hooks apenas quando o binário local do `husky` estiver disponível.
- 2026-07-01: no storefront do Selo Libertária, uma leitura antiga e vazia de `/api/cart` nunca pode sobrescrever um estado de carrinho mais novo disparado por `Adicionar ao carrinho`; badge do header, drawer e atalho flutuante devem responder ao mesmo contexto cliente e preservar a contagem otimista até o snapshot atualizado chegar.
- 2026-07-01: nos cards públicos de livros, os fluxos `Adicionar ao carrinho` e `Comprar` não podem cancelar a própria mutação por causa do estado local de loading; esse estado só deve bloquear cliques concorrentes, enquanto badge, drawer e checkout continuam espelhando o mesmo snapshot ativo.
- 2026-07-01: em `/products`, a primeira dobra de `Livros` deve seguir a composição preta editorial do Figma e o CTA `Ver catálogo` precisa levar para a grade publicada na mesma rota; quando houver só um livro, o layout deve evitar stretch e vazios de marketplace genérico.
- 2026-07-02: no shell do admin, o bloco de marca da sidebar e da navegação móvel deve usar o logo oficial do Selo Libertária no lugar de quadrado vazio, preservando fundo preto, superfície papel e leitura editorial discreta do backoffice.
- 2026-07-02: em páginas singleton do admin editorial, não exponha `Título interno`, `Ordem`, `Resumo` ou `Corpo principal` quando esses campos não controlarem a saída pública; preserve no formulário apenas publicação e blocos realmente renderizados no site.
- 2026-07-02: no admin editorial, prefira um CTA de `Salvar` flutuante e persistente no viewport em vez de repetir botão por bloco; isso reduz rolagem de retorno sem fragmentar o envio do formulário.
- 2026-07-18: ferramentas editoriais de texto devem permanecer mínimas e aparecer somente em campos longos dos blocos já previstos; grave Markdown simples no mesmo campo de texto, sem criar editor genérico amplo, e renderize no público com fallback seguro para conteúdo legado em texto plano.
- 2026-07-18: controles editoriais de imagem devem usar uma imagem por campo público, com seleção via arquivo, prévia local, confirmação explícita de troca, descarte antes de salvar e persistência pelo mesmo campo `*Src` já consumido pelas páginas públicas.
- 2026-07-18: regressões do fluxo editorial devem ser cobertas no contrato público das ferramentas: componente de imagem valida prévia local, ausência de upload imediato e descarte; actions server-side validam preservação de URL existente, upload no save e manutenção de Markdown/texto legado no mesmo campo.
