# Inventário e mapa de migração — Wix → selolibertaria.com.br

**Fonte antiga:** `natalianolli5.wixsite.com/website-1` (site Wix ativo, 34 rotas internas)
**Fonte antiga 2:** `www.selolibertaria.com.br` (domínio oficial, hoje servindo landing "Em construção")
**Destino:** `preprod.selolibertaria.com.br` → produção em `selolibertaria.com.br`
**Levantamento:** 17 set 2026

---

## 1. Veredito por página do site antigo

| # | Rota Wix | Título Wix | Conteúdo real? | Veredito | Destino no site novo |
|---|---|---|---|---|---|
| 1 | `/` (featured-project) | Início | Só imagem + "em breve lançamento do livro" | **Reescrever** | `/` — a capa é *little fish, big fish*; vira o bloco de pré-lançamento |
| 2 | `/idealizadora` | "sarau safado" (título trocado) | **Sim, 1.6k caracteres** — melhor texto do site inteiro | **Migrar quase integral** | `/about` (bio) + `/sarau-safado` (história do sarau) |
| 3 | `/portfolio` | Portfolio (List) | **Sim** — 7 projetos com descrição completa | **Migrar integral** | `/projects` |
| 4 | `/portfolio/{slug}` ×7 | Itens de portfólio | **Sim** — descrição + ano + galeria | **Migrar integral** | `/projects/{slug}` |
| 5 | `/shop`, `/shop-1`, `/shop-2` | Loja (3 duplicatas) | Grade de 3 produtos | **Consolidar em 1** | `/products` |
| 6 | `/product-page/{slug}` ×3 | PDPs | **Sim** — sinopse + trecho de poema | **Migrar integral** | `/products/{slug}` |
| 7 | `/eventos-com-autores` | eventos | Só galeria de 7 cards do Sarau (sem texto) | **Reclassificar** | `/sarau-safado` → seção "Elenco / edições" |
| 8 | `/cópia-livros-sonoros` | "Políticas da loja" (título errado) | **Sim** — texto de audiolivros/acessibilidade | **Migrar + renomear** | `/audiolivros` (nova rota) |
| 9 | `/na-imprensa-e-artigos` | Na imprensa e Artigos | **Sim** — 4 referências de imprensa | **Migrar + expandir** | `/about#imprensa` ou `/imprensa` |
| 10 | `/notícias` | Notícias | **Lorem ipsum do Wix** ("Este é um artigo de notícias...") | **Matar** | 410 / redirect `/projects` |
| 11 | `/blog` + `/post/...` ×3 | Blog | **Lorem ipsum do Wix** (posts demo de 2016, autor "Luiz Ferreira") | **Matar** | 410 / redirect `/` |
| 12 | `/agenda` | Agenda | "Não há nenhuma agenda para exibir" | **Matar** | Redirect `/events` |
| 13 | `/gift-card` | Vale-presente | R$ 50, funcional | **Decisão de produto** | Só migrar se a loja nova suportar |
| 14 | `/contato` | Contato | Formulário + e-mail | **Já reescrito no novo** | `/contact` ✅ |
| 15 | `/cart-page`, `/checkout`, `/my-*` | Wix eCommerce | Infra Wix | **Matar** | Fluxo próprio da loja nova |

**Resumo:** de 34 rotas, **13 têm conteúdo real**, **6 são lorem ipsum do Wix** e o resto é infraestrutura de e-commerce. O trabalho de conteúdo é menor do que parece — mas os 13 que sobram são densos e estão hoje escondidos atrás de títulos errados.

---

## 2. Os três problemas herdados que a migração precisa resolver

**a) Títulos de página não correspondem ao conteúdo.**
`/idealizadora` tem `<title>sarau safado | Selo Libertária</title>` e o conteúdo é a bio da Natália. `/cópia-livros-sonoros` tem `<title>Políticas da loja</title>` e o conteúdo é sobre audiolivros gratuitos. Isso é o pior erro de SEO do site antigo: as duas páginas com melhor conteúdo estão indexadas com o título errado.

**b) Três lojas idênticas.** `/shop`, `/shop-1` e `/shop-2` servem exatamente os mesmos 3 produtos. Conteúdo duplicado puro.

**c) Lorem ipsum indexado.** `/notícias` e `/blog` publicam texto de demonstração do Wix ("Este é um artigo de notícias. Adicione um artigo ou um pequeno texto...") assinado por um autor fictício. Está no ar e rastreável.

---

## 3. Tabela de redirects 301

Aplicar tanto para `natalianolli5.wixsite.com/website-1/*` quanto para `www.selolibertaria.com.br/*`.

```
# Páginas com conteúdo
/idealizadora                                          → /about                        301
/portfolio                                             → /projects                     301
/portfolio/festival-mário-de-andrade---2024            → /projects/festival-mario-de-andrade-2024        301
/portfolio/laboratório-de-escritas-dissidentes-        → /projects/laboratorio-escritas-dissidentes      301
/portfolio/sarau-levante-                              → /projects/sarau-levante                         301
/portfolio/flipenha-2022                               → /projects/flipenha-2022                         301
/portfolio/livro-de-vênus---laboratório-para-criação-e-edição-de-escritos-eróticos-
                                                       → /projects/livro-de-venus                        301
/portfolio/lançamento-do-livro-ninfas-do-tietê         → /projects/lancamento-ninfas-do-tiete            301
/portfolio/sarau-safado-                               → /projects/sarau-safado                          301
/eventos-com-autores                                   → /sarau-safado                 301
/cópia-livros-sonoros                                  → /audiolivros                  301
/na-imprensa-e-artigos                                 → /about#imprensa               301
/contato                                               → /contact                      301

# Loja — consolidar as três duplicatas
/shop                                                  → /products                     301
/shop-1                                                → /products                     301
/shop-2                                                → /products                     301
/product-page/ninfas-do-tietê                          → /products/ninfas-do-tiete     301
/product-page/cópia-de-sexo-estranho-com-desconhecidos-em-lugares-impróprios-ebook
                                                       → /products/sexo-estranho-com-desconhecidos-em-lugares-improprios  301
/product-page/cópia-de-vírus-do-beijo                  → /products/virus-do-beijo      301
/ninfasdotietê-livroimpresso                           → /products/ninfas-do-tiete     301

# Conteúdo morto (lorem ipsum / vazio)
/notícias                                              → /projects                     301
/blog                                                  → /                             301
/post/*                                                → /                             301
/agenda                                                → /events                       301

# Infra Wix — não migrar
/cart-page, /checkout, /thank-you-page, /my-*, /profile/*  → 410 Gone
```

**Atenção aos slugs acentuados.** O Wix usa URLs com acento e espaço percent-encoded (`/portfolio/laborat%C3%B3rio-de-escritas-dissidentes-`, com hífen final). O redirect precisa casar a forma **encoded** e a **decoded**, e o hífen sobrando no fim não é erro de digitação — está na URL real.

---

## 4. Lacunas de conteúdo que a migração NÃO resolve

Coisas que não existem em lugar nenhum e precisam ser escritas do zero ou levantadas com a Natália:

| Lacuna | Onde entra | Quem resolve |
|---|---|---|
| Ficha técnica de *sexo estranho* (páginas, ISBN, ano exato) | PDP | Natália |
| ISBN da 2ª edição de *Ninfas do Tietê* (Selo Libertária, 2021) | PDP | Natália |
| Data, local e preço da próxima edição do Sarau | `/sarau-safado`, `/events` | Natália |
| Data de lançamento e ficha de *little fish, big fish* | `/` (pré-lançamento) | Natália |
| Política de frete, troca e prazo de entrega | `/terms`, checkout | Operação |
| Links diretos dos audiolivros no YouTube | `/audiolivros` | Recuperável do canal |
| Créditos de fotografia por imagem | Galeria de projetos | Parcial (ver §5) |

---

## 5. Créditos de fotografia já conhecidos

Vieram do site antigo e **precisam ser preservados** — são obrigação com os fotógrafos, não decoração:

- **Alan Fujito** — Laboratório de escritas dissidentes, Sarau Levante, Livro de Vênus
- **Roberto Constantino** — Sarau Safado
- **Vanusa Passos** — ilustrações de *Ninfas do Tietê* (2ª ed.)
- **Persie Oliveira** — ilustrações de *sexo estranho*
- **Daniel Firmino** — arte de *sexo estranho*
- **Talles Azigon** — revisão de *sexo estranho*
- **Deanna Ribeiro** — desenhos de *vírus do beijo*
- **Bárbara Gabriela** — arte/design de *vírus do beijo*
- **Sol Fagnello** — direção e edição da videoperformance *Ninfas do Tietê*
