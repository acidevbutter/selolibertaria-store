# Goal 1: Ligar todas as páginas ao backend

## Objetivo

Eliminar o uso de mocks nas páginas públicas e administrativas relevantes, conectando cada superfície ao backend correto com fallback seguro apenas quando necessário.

## Problema atual

Hoje, várias páginas ainda renderizam conteúdo mockado ou parcialmente mockado, mesmo quando o admin já salva dados no banco. Isso cria uma quebra entre o que a equipe edita no backoffice e o que o visitante vê no storefront.

## Escopo

- Home pública
- Pages institucionais: `about`, `contact`, `events`, `projects`, `sarau-safado`
- PDP e catálogo, quando houver dados dependentes de backend
- Admin editorial e admin operacional, garantindo que tudo persista e reflita no público
- Revalidação após mutações no admin

## Estratégia

1. Mapear cada rota e identificar a origem real de dados.
2. Trocar leitura de mock por store/backend canônico.
3. Manter fallback seguro somente quando o backend estiver indisponível ou sem documento publicado.
4. Garantir que uploads, imagens, ordem e publicação tenham reflexo público imediato.
5. Revisar a serialização para não quebrar SSR, build ou performance.

## Critérios de aceite

- Nenhuma página pública importante depende de mock como fonte primária.
- O conteúdo editado no admin aparece no storefront.
- `events`, `projects`, `about`, `contact`, `home` e `sarau-safado` leem do backend corretamente.
- Publicação, ordem, imagens e campos editoriais funcionam de ponta a ponta.
- O fallback continua seguro, sem quebrar quando Mongo ou integrações estiverem indisponíveis.

## Entregáveis

- Mapeamento completo de rotas e fontes de dados.
- Ajustes no store editorial e nos fluxos relacionados.
- Remoção gradual dos mocks da experiência pública.
- Verificação de revalidação e consistência visual após salvar no admin.

## Status atual

- Rotas públicas do escopo (`/`, `/about`, `/contact`, `/events`, `/projects`, `/sarau-safado`) usam backend editorial como fonte primária via `editorial-content-store`.
- Catálogo e PDP do escopo (`/products`, `/product/[slug]`, `/category/[slug]`) usam backend canônico do catálogo via `commerce.product.*`.
- Admin editorial lê do store canônico com fallback seguro, grava em Mongo e revalida as superfícies públicas e o hub `/admin/editorial`.
- Superfícies operacionais revisadas nesta meta passaram a preferir `settings` quando já havia backend canônico, como `supportEmail` em contato, footer e preview de emails.

## Riscos

- Quebrar páginas em ambiente sem Mongo.
- Deixar campos salvos no admin sem reflexo no storefront.
- Misturar conteúdo editorial com mock residual em alguma rota.
