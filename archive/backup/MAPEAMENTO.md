# Mapeamento backup → editorial content

Fonte: `backup/conteudo/` + `backup/imagens-web/`.
Imagens no front: `selolibertaria-store/public/images/selolibertaria/*.webp` (thumb em `.../thumb/`).

## Carregado agora

| Backup | Destino | Como |
|---|---|---|
| Copy da home (`01-copy-deck.md` `/`) | `page_home` / `home` | `content` JSON + `contentDoc` (blocos `home-*`) |
| Copy de Sobre | `page_about` / `about` | `content` JSON + blocos, inclusive `about-press-*` |
| Copy do catálogo | `page_products` / `products` | `content` JSON + blocos `products-*` |
| Copy de contato + linha de imprensa | `page_contact` / `contact` | `content` JSON + bloco `contact-press-note` |
| Copy de `/projects` | `page_projects` / `projects` | `content` JSON + blocos |
| 6 projetos (sem o card do Sarau) | `type=project` | registros publicados com capa + `gallery` |
| 3 livros + *little fish, big fish* | `catalog_products` | PDPs em `/product/{slug}` |
| Capas, galerias, foto da autora | `/images/selolibertaria/*.webp` | arquivos estáticos no front |

### Projetos publicados

- `/projects/laboratorio-escritas-dissidentes`
- `/projects/sarau-levante`
- `/projects/livro-de-venus`
- `/projects/festival-mario-de-andrade-2024`
- `/projects/flipenha-2022`
- `/projects/lancamento-ninfas-do-tiete`

**Fora, de propósito:** card `Sarau Safado` em `/projects`. A página `/sarau-safado` não foi alterada.

### Produtos

| Slug | Preço | Imagens |
|---|---|---|
| `ninfas-do-tiete` | R$ 49,00 | capa + ilustração Vanusa Passos |
| `sexo-estranho-com-desconhecidos-em-lugares-improprios` | R$ 78,00 | capa + orelha Talles Azigon |
| `virus-do-beijo` | R$ 58,00 | capa + página de abertura |
| `little-fish-big-fish` | já existia | capa de pré-lançamento |

## Mapeado, ainda não construído

### `/sarau-safado` (não mexer agora)

Conteúdo pronto em `01-copy-deck.md`. Imagens já no front:

- Capa: `capa-projeto-sarau-safado.webp`
- Galeria: `projeto-sarau-safado-01.webp` … `-11.webp` — crédito **Roberto Constantino**
- Elenco/cartazes de `/eventos-com-autores`: `eventos-autores-01.webp` … `-07.webp` (Natália, Bixaputa, Netto Duarte, José de Martins, Gracco, Di Grazia Milli, Rudá)
- Foto/cartaz da autora: `natalia-nolli-sasso-sarau-safado.webp`

Schema `Event` e pendência de data/ingresso da próxima edição estão no copy deck.

### `/events` (não mexer agora)

A agenda do backup é auxiliar: o menu principal continua no Sarau. Empty state: “Nenhuma data confirmada…”. Os cartazes `eventos-autores-*` pertencem ao Sarau, não a esta rota.

Redirect antigo: `/eventos-com-autores` → `/sarau-safado`.

### `/audiolivros` (rota nova, só mapeada)

Não existe no código. Precisa de tipo de página fixa + migration + rota + editor de blocos.

- Texto: `01-copy-deck.md` seção `/audiolivros`
- Títulos: *Ninfas do Tietê* e *sexo estranho…* (YouTube, canal `UCVfN9ZkKHdROtCzgZc9QLbQ`)
- Pendência: links diretos dos vídeos (“Link para ouvir” no Wix)

Categoria de catálogo já existe: `edicoes-sonoras`.

## O que o backup tem e o site já cobre de outro jeito

- 301 da tabela de migração (`00-inventario-e-migracao.md`) — virada de domínio, não desta fatia
- Schema JSON-LD (`02-fichas-de-produto.md`) — PDP já emite Product; Book/Event ficam para SEO depois
- Fila de artigos do cluster B/D (`03-estrategia-seo.md`) — blog futuro, não páginas fixas
- Pasta `imagens-thumb/` — copiada para `public/images/selolibertaria/thumb/` para `srcset` depois

## Como reaplicar

```bash
docker exec selolibertaria-backend-api python scripts/seed_backup_editorial.py
```

Idempotente. Não reescreve `events` nem `sarau-safado`.
