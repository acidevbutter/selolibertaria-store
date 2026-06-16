# Goal 1 Route Map

## Público

| Rota | Fonte canônica atual | Fallback seguro | Observações |
| --- | --- | --- | --- |
| `/` | `getEditorialHomePage()`, `listEditorialEvents()`, `getEditorialSarauPage()`, `commerce.product.browse()` | Mock editorial publicado quando Mongo falha ou não há documento publicado; catálogo vazio quando Stripe falha | Home já depende do store editorial e do catálogo Stripe. |
| `/about` | `getEditorialAboutPage()` | Mock editorial publicado | Página institucional ligada ao documento `page_about`. |
| `/contact` | `getEditorialContactPage()` | Mock editorial publicado | Página institucional ligada ao documento `page_contact`. |
| `/events` | `listEditorialEvents()` | Lista mock quando Mongo falha ou está vazio | A renderização pública ainda filtra `published`. |
| `/projects` | `listEditorialProjects()` | Lista mock quando Mongo falha ou está vazio | A renderização pública ainda filtra `published`. |
| `/sarau-safado` | `getEditorialSarauPage()` | Mock editorial publicado | Hero já aceita imagem vinda do admin. |
| `/products` | `commerce.product.browse()` | Catálogo vazio quando Stripe falha | Catálogo já lê do backend Stripe. |
| `/product/[slug]` | `commerce.product.get()` | `notFound()` quando Stripe falha ou item não existe | PDP usa backend canônico do catálogo. |
| `/category/[slug]` | `commerce.product.browse({ category })` | `notFound()` quando categoria não resolve produtos | Continua dependente do catálogo Stripe. |

## Admin editorial

| Rota | Fonte canônica atual | Fallback seguro | Observações |
| --- | --- | --- | --- |
| `/admin/editorial` | `listEditorialEventRecords()`, `listEditorialProjectRecords()`, `getEditorial*Record()` | Mock editorial quando Mongo falha ou ainda não foi seedado | Hub passa a abrir com dados coerentes mesmo sem seed manual. |
| `/admin/editorial/home` | `getEditorialHomeRecord()` | Mock via store administrativo | Form salva em `page_home` e revalida `/`. |
| `/admin/editorial/about` | `getEditorialAboutRecord()` | Mock via store administrativo | Form salva em `page_about` e revalida `/about`. |
| `/admin/editorial/contact` | `getEditorialContactRecord()` | Mock via store administrativo | Form salva em `page_contact` e revalida `/contact`. |
| `/admin/editorial/sarau-safado` | `getEditorialSarauRecord()` | Mock via store administrativo | Form salva em `page_sarau` e revalida `/sarau-safado`. |
| `/admin/editorial/events` | `listEditorialEventRecords()` | Lista mock via store administrativo | Ordem, publicação e edição refletem no público após mutações. |
| `/admin/editorial/projects` | `listEditorialProjectRecords()` | Lista mock via store administrativo | Ordem, publicação e edição refletem no público após mutações. |

## Revalidação já coberta

- `events`: `/`, `/events`, `/admin/editorial/events`, `/admin/editorial/events/[slug]`
- `projects`: `/`, `/projects`, `/admin/editorial/projects`, `/admin/editorial/projects/[slug]`
- `sarau-safado`: `/`, `/sarau-safado`, `/admin/editorial/sarau-safado`
- `about`: `/`, `/about`, `/admin/editorial/about`
- `contact`: `/`, `/contact`, `/admin/editorial/contact`
- `home`: `/`, `/admin/editorial/home`

## Pendências visíveis para próximos passos

- Reduzir fallback visual residual em componentes que ainda importam defaults estáticos de `selolibertaria-content`.
- Revisar superfícies operacionais além do editorial para garantir que nenhuma continue mostrando textos ou estados mockados quando o backend real já existe.
- Validar tudo com `yarn build` após os próximos patches da Goal 1.
