# Prompt 01 — Tela de pré-venda: dados dinâmicos, checkout e i18n

## Contexto

A tela de pré-venda já está implementada como camada visual em
`src/ui/pre-venda/pre-sale-landing.tsx`, alimentada por um objeto
`PreSaleCampaign` (`src/lib/pre-sale.ts`). Hoje esse objeto é **estático**
(`LFBF_CAMPAIGN`) e os CTAs apontam para `#`. A rota
`src/app/(store)/pre-venda/little-fish-big-fish/page.tsx` chama `notFound()`
quando `isPreSaleModeEnabled()` é falso.

Design de origem: Claude Design `Pre-venda Little Fish Big Fish.dc.html`
(placeholders `{{ price }}`, `{{ launchWindow }}`, `{{ buyLink }}`).

## Objetivo

Tornar a tela de pré-venda funcional de ponta a ponta: campanha vinda de fonte
editável, botão "Comprar" abrindo um checkout real, textos internacionalizáveis,
SEO/OpenGraph corretos e telemetria de eventos.

## Requisitos funcionais

### 1. Fonte da campanha

- Ler a campanha de `getPreSaleCampaign(slug)` **sem quebrar o contrato de tipo
  `PreSaleCampaign`**. A origem dos dados passa a ser o admin (ver
  `pre-venda-03-admin-modo-pre-venda.md`): buscar via `settings-store` /
  FastAPI (`GET /pre-sale/campaigns` ou equivalente) com `cache: "no-store"` e
  timeout curto (padrão de `getSettingsDoc`, 1.8 s), com fallback para
  `LFBF_CAMPAIGN` se a API falhar.
- Vincular a campanha a um `productSlug` opcional. Quando presente, herdar
  `price` (via `commerce.product.get` + `formatMoney`), imagem e nome do produto,
  deixando o texto da campanha sobrepor quando definido.
- Suportar `launchAt` (ISO 8601). Quando presente, é a fonte da verdade da data
  de lançamento em toda a tela (inclusive `launchWindow` formatado por `Intl`).

### 2. Checkout / "Comprar agora"

- `buyHref` deixa de ser string livre e passa a resolver para **um destino de
  compra real**, nesta ordem de preferência:
  1. `productSlug` definido → `/product/{slug}` (fluxo de carrinho/checkout já
     existente), ou adicionar ao carrinho direto com `addToCart` server action.
  2. Link de preferência do Mercado Pago (checkout pré-criado) informado no admin.
  3. Sem nenhum dos dois → CTA vira "Avise-me" (captura de e-mail, reaproveitar
     `Global.newsletter.*` / fluxo de `favorite-discount-alerts`).
- Todos os CTAs de compra (hero, card de preço, chamada final, banner A, card B,
  pop-up) usam a mesma resolução — centralizar em um helper
  `resolvePreSaleBuyAction(campaign)` em `src/lib/pre-sale.ts`.
- Respeitar `canBuyOnSelolibertaria(session?.user.role)` como o resto da loja
  (usuário sem permissão de compra vê o CTA desabilitado com tooltip).

### 3. i18n

- Extrair todas as strings hardcoded de `pre-sale-landing.tsx` e
  `pre-sale-countdown-popup.client.tsx` para `messages/pt-BR.json` sob o
  namespace `Selo.preSale.*` (seguir o padrão de `Selo.home.*`).
- Server Components usam `getTranslations("Selo.preSale")`; o pop-up (client)
  recebe as labels já resolvidas via props ou usa o `IntlClientProvider`.
- Os campos textuais de `PreSaleCampaign` (curadoria da campanha) continuam vindo
  do admin; apenas rótulos de UI ("Comprar agora", "dias", "Ver detalhes do
  livro" etc.) vão para i18n.

### 4. SEO / metadados

- `generateMetadata` já existe; completar com: `keywords`, `authors`,
  `openGraph.type = "book"`, `twitter.card = "summary_large_image"`.
- Gerar `opengraph-image.tsx` na pasta da rota (padrão de
  `src/app/(store)/product/[slug]/opengraph-image.tsx`), usando a imagem
  `badge` da campanha e o título.
- `robots`: `index` somente quando `isPreSaleModeEnabled()` **e** a campanha está
  dentro da janela pública (ver prompt 03). Fora disso, `noindex, nofollow`.
- Adicionar JSON-LD `Book` + `Offer` (`@type: Offer`, `availability:
  PreOrder`, `priceCurrency`, `price`, `priceValidUntil = launchAt`).

### 5. Analytics

- Emitir eventos via Umami (`data-umami-event`):
  - `presale_view` (na montagem da página, com `slug`);
  - `presale_cta_click` (`{ slug, placement: "hero" | "price-card" | "closing" |
    "banner-a" | "card-b" | "popup" }`);
  - `presale_popup_open`, `presale_popup_dismiss`, `presale_popup_cta_click`
    (detalhados no prompt 02).

### 6. Estados de borda

- `launchAt` no passado → banner "Lançado! Ver na loja" no lugar do card de
  pré-venda; contagem regressiva zera (o pop-up já trata `remaining.done`).
- Imagens ausentes → usar `/images/ninfas-example.png` como fallback (padrão do
  `HomeHero`).
- Campanha existe mas `isPreSaleModeEnabled()` é falso → `notFound()` (já feito);
  garantir que não vaza no `sitemap.ts`.

## Contrato de dados (extensão sugerida de `PreSaleCampaign`)

```ts
productSlug?: string;           // vincula a um produto do catálogo
mercadoPagoPreferenceUrl?: string; // link de checkout MP pré-criado
publicWindow?: { startAt?: string; endAt?: string }; // janela de visibilidade
currency?: string;              // ISO 4217, default "BRL"
```

## Critérios de aceite

- [ ] Com `PRESALE_MODE=true` e campanha vinculada a um produto, "Comprar agora"
      leva a um checkout que conclui um pedido de pré-venda no sandbox do
      Mercado Pago.
- [ ] Sem produto e sem link MP, o CTA vira captura de e-mail e persiste o lead.
- [ ] Nenhuma string de UI hardcoded fora de `messages/*.json`
      (`grep` por acentos/labels na pasta `src/ui/pre-venda` limpo).
- [ ] `curl -sI /pre-venda/little-fish-big-fish` retorna `X-Robots-Tag` coerente
      com o estado do modo/janela.
- [ ] OG image renderiza; Rich Results Test valida o JSON-LD `Book`/`Offer`.
- [ ] Eventos de analytics disparam (conferir no painel Umami em dev).
- [ ] `yarn lint`, `yarn test` e `tsc --noEmit` limpos.

## Testes

- `src/lib/pre-sale.test.ts`: `resolveCountdownTarget` (com/sem `launchAt`,
  data inválida), `fillCampaignText`, `resolvePreSaleBuyAction` (3 ramos),
  `getPreSaleCampaign` respeitando a flag.
- Teste de componente (Testing Library) para `PreSaleLanding`: renderiza título,
  preço formatado e CTA com href resolvido; estado "lançado".
