# Estratégia de conteúdo e SEO — Selo Libertária

---

## 1. Onde o selo está hoje

**A situação de busca é incomum e favorável.** O Selo Libertária se descreve como *"único selo editorial brasileiro dedicado à literatura erótica com acessibilidade"* — e essa combinação (literatura erótica + poesia + audiolivro gratuito + evento presencial em São Paulo) praticamente não tem concorrente direto disputando as mesmas buscas. O que existe é:

| Concorrente indireto | O que ele domina | Onde não chega |
|---|---|---|
| Grandes editoras com selo erótico | Termos transacionais de ficção erótica comercial | Poesia erótica autoral, cena de SP, formação |
| Sites de "contos eróticos" | Volume enorme de tráfego informacional de baixa qualidade | Autoridade literária, nome de autora, evento |
| Livrarias (Amazon, Travessa, Taverna, Dois Pontos) | **Rankeiam hoje para "Ninfas do Tietê"** | Contexto de autora, catálogo completo, sarau |
| Coletivos e saraus de SP | Agenda local | Catálogo próprio, publicação |

**O problema imediato:** hoje, quem busca *"Ninfas do Tietê"* encontra a Amazon, a Travessa, a Livraria Taverna e a Dois Pontos — não o selo que publica o livro. O domínio oficial serve uma página "Em construção", e o site com conteúdo real está num subdomínio `wixsite.com` com títulos de página trocados. **Recuperar a marca própria é o ganho #1 da migração, e não custa nenhum conteúdo novo.**

---

## 2. Mapa de autoridade tópica

```
PILAR: Literatura erótica brasileira
│
├── CLUSTER A — Obra e autoria  ............................. converte venda
│   ├── /products/ninfas-do-tiete                    [transacional]
│   ├── /products/sexo-estranho-...                  [transacional]
│   ├── /products/virus-do-beijo                     [transacional]
│   ├── /about (Natália Nolli Sasso)                 [navegacional/marca]
│   └── Artigos: "trilogia s3xo são paulo", "quem é Natália Nolli Sasso"
│
├── CLUSTER B — Erotismo, cidade e corpo  .................. constrói autoridade
│   ├── "o que é literatura erótica (e o que não é)"
│   ├── "erotismo x pornografia: a diferença que a literatura faz"
│   ├── "poesia erótica brasileira: por onde começar"
│   ├── "São Paulo como corpo: a cidade na poesia contemporânea"
│   └── "Safo: a primeira poeta erótica do ocidente"
│
├── CLUSTER C — Cena viva de São Paulo  .................... traz público local
│   ├── /sarau-safado                                [navegacional]
│   ├── /events                                      [navegacional]
│   ├── "saraus de poesia em São Paulo: guia"
│   └── "onde ouvir poesia ao vivo no centro de SP"
│
├── CLUSTER D — Formação e escrita  ........................ capta leads de curso
│   ├── /projects (laboratórios)
│   ├── "como escrever poesia erótica sem cair no clichê"
│   ├── "oficinas de escrita criativa em São Paulo"
│   └── "escrita dissidente: o que é"
│
└── CLUSTER E — Acessibilidade  ............................ diferencial exclusivo
    ├── /audiolivros                                 [transacional/gratuito]
    ├── "audiolivros gratuitos de poesia brasileira"
    └── "literatura acessível: por que audiolivro não é luxo"
```

---

## 3. Mapa de palavras-chave por intenção

| Palavra-chave | Intenção | Volume est. | Dificuldade | Página |
|---|---|---|---|---|
| `ninfas do tietê` | Navegacional | Baixo, alta conversão | **Baixa** — só precisa existir | `/products/ninfas-do-tiete` |
| `natália nolli sasso` | Navegacional | Baixo | **Baixa** | `/about` |
| `selo libertária` | Navegacional | Baixo | **Baixa** | `/` |
| `sarau safado` | Navegacional | Baixo, crescente | **Baixa** | `/sarau-safado` |
| `livro de poesia erótica` | Comercial | Médio | Média | `/products` |
| `literatura erótica brasileira` | Informacional | Médio | Média | Artigo pilar |
| `poesia erótica brasileira` | Informacional | Médio | Média | Artigo cluster B |
| `audiolivro gratuito poesia` | Comercial | Baixo-médio | **Baixa** | `/audiolivros` |
| `sarau de poesia em são paulo` | Local/informacional | Médio | Média | Artigo cluster C |
| `oficina de escrita criativa são paulo` | Comercial | Médio-alto | **Alta** | Artigo cluster D |
| `erotismo e pornografia diferença` | Informacional | Médio | Média | Artigo cluster B |
| `editora independente literatura erótica` | Comercial | Baixo | **Baixa** | `/about` |

**Leitura da tabela:** as buscas de marca são fáceis e de alta conversão — e hoje estão sendo entregues para marketplaces. Comece por elas. As buscas informacionais (cluster B) são o investimento de médio prazo que faz o selo aparecer para quem ainda não o conhece.

---

## 4. Matriz de prioridade

**Vitórias rápidas** (baixa concorrência + alto valor de negócio) — fazer primeiro:
1. As 3 PDPs completas com schema `Book` — recupera as buscas de marca das livrarias
2. `/about` com a bio completa da Natália — hoje esse texto está numa página chamada "sarau safado"
3. `/audiolivros` como rota própria — hoje está numa página chamada "Políticas da loja"
4. `/sarau-safado` com `Event` schema — resultado rico de evento no Google

**Apostas grandes** (alto volume + alta concorrência) — investir em qualidade:
5. Pilar "Literatura erótica brasileira: um guia"
6. "Poesia erótica brasileira: por onde começar"

**Preenchimento** (baixo volume, barato de produzir):
7. Glossário, páginas de projeto individuais, guia de saraus de SP

**Evitar:**
- Conteúdo genérico de "10 livros eróticos" — disputa com sites de afiliado e não constrói nada
- Traduzir para inglês nesta fase: o público é local e o texto é intraduzível sem perder tudo

---

## 5. Fila de conteúdo priorizada

| # | Título | Palavra-chave | Intenção | Prioridade | Palavras |
|---|---|---|---|---|---|
| 1 | Ninfas do Tietê (PDP) | ninfas do tietê | Transacional | Vitória rápida | 600 |
| 2 | sexo estranho… (PDP) | sexo estranho desconhecidos lugares impróprios | Transacional | Vitória rápida | 700 |
| 3 | vírus do beijo (PDP) | vírus do beijo livro | Transacional | Vitória rápida | 500 |
| 4 | Sobre o selo / a autora | natália nolli sasso | Navegacional | Vitória rápida | 900 |
| 5 | Audiolivros gratuitos | audiolivro gratuito poesia | Comercial | Vitória rápida | 500 |
| 6 | Sarau Safado | sarau safado / sarau poesia sp | Navegacional | Vitória rápida | 800 |
| 7 | A trilogia s3xo são paulo | trilogia s3xo são paulo | Informacional | Vitória rápida | 1.200 |
| 8 | Literatura erótica: um guia brasileiro | literatura erótica brasileira | Informacional | **Aposta (pilar)** | 3.000 |
| 9 | Erotismo não é pornografia | erotismo x pornografia | Informacional | Aposta | 1.800 |
| 10 | Poesia erótica brasileira: por onde começar | poesia erótica brasileira | Informacional | Aposta | 2.000 |
| 11 | Safo, a primeira poeta erótica | safo poeta grega poesia erótica | Informacional | Preenchimento | 1.400 |
| 12 | São Paulo como corpo | cidade poesia são paulo | Informacional | Preenchimento | 1.500 |
| 13 | Saraus de poesia em São Paulo: guia | sarau poesia são paulo | Local | Aposta | 1.800 |
| 14 | Como escrever poesia erótica sem clichê | escrever poesia erótica | Informacional | Aposta | 2.000 |
| 15 | O que é escrita dissidente | escrita dissidente | Informacional | Preenchimento | 1.200 |
| 16 | Literatura acessível e audiolivro | literatura acessível audiolivro | Informacional | Preenchimento | 1.200 |

---

## 6. Calendário editorial — 12 semanas

Cadência realista para um selo pequeno: **1 publicação por semana**, com as seis primeiras semanas dedicadas a páginas fixas (não artigos). Não adianta blogar antes de o catálogo existir.

**Mês 1 — Fundação (páginas, não posts)**
- Semana 1: As 3 PDPs completas + schema `Book`/`Product`
- Semana 2: `/about` com bio, linha editorial e imprensa + schema `Organization`
- Semana 3: `/audiolivros` + `/sarau-safado` com schema `Event`
- Semana 4: `/projects` com as 7 páginas individuais de projeto

**Mês 2 — Autoridade**
- Semana 5: **Pilar** — "Literatura erótica brasileira: um guia" (3.000 palavras)
- Semana 6: "A trilogia s3xo são paulo" (liga o pilar às 3 PDPs)
- Semana 7: "Erotismo não é pornografia"
- Semana 8: "Poesia erótica brasileira: por onde começar"

**Mês 3 — Expansão e local**
- Semana 9: "Saraus de poesia em São Paulo: guia" (alcance local)
- Semana 10: "Como escrever poesia erótica sem cair no clichê" (isca para laboratórios)
- Semana 11: "Safo, a primeira poeta erótica do ocidente" (liga ao nome do sarau)
- Semana 12: "São Paulo como corpo" + revisão de links internos de tudo que foi publicado

---

## 7. Plano de links internos

**Regra:** todo artigo do cluster B e D termina apontando para uma PDP ou para `/sarau-safado`. Conteúdo que não leva a lugar nenhum é conteúdo que não paga o próprio custo.

```
Pilar "Literatura erótica brasileira"
   ├─→ /products (âncora: "catálogo do Selo Libertária")
   ├─→ "Erotismo não é pornografia"
   ├─→ "Poesia erótica brasileira"
   └─→ /about (âncora: "Natália Nolli Sasso")

"Poesia erótica brasileira: por onde começar"
   ├─→ /products/ninfas-do-tiete
   ├─→ /audiolivros  (âncora: "ouvir de graça")
   └─→ pilar (link de volta)

"Safo, a primeira poeta erótica"
   └─→ /sarau-safado  (âncora: "o sarau que leva o nome dela")

"Como escrever poesia erótica sem clichê"
   ├─→ /projects/livro-de-venus
   └─→ /projects/laboratorio-escritas-dissidentes

"Saraus de poesia em São Paulo"
   └─→ /sarau-safado + /events

Cada PDP
   ├─→ as outras duas PDPs (âncora: "o próximo livro da trilogia")
   ├─→ /audiolivros
   └─→ /about
```

---

## 8. SEO técnico — achados no preprod

| Achado | Gravidade | Correção |
|---|---|---|
| **Canonical aponta para `preoprod.selolibertaria.com.br`** (typo) enquanto os links usam `preprod` | **Alta** | Corrigir a variável de ambiente do canonical. Issue aberta no GitHub. |
| Ambiente de preprod indexável | **Alta** | `X-Robots-Tag: noindex` + `Disallow: /` no `robots.txt` do preprod, até a virada |
| Domínio oficial serve "Em construção" | **Alta** | Virar para o site novo assim que o catálogo tiver produto |
| `/products` vazio ("catálogo ainda não tem produtos") | **Alta** | Cadastrar os 3 livros — a loja é a razão do site |
| Três URLs de loja duplicadas no site antigo | Média | Resolvido pelos 301 do mapa de migração |
| Lorem ipsum do Wix indexado (`/notícias`, `/blog`) | Média | 301 ou 410 na virada |
| Títulos de página não correspondem ao conteúdo (site antigo) | Média | Resolvido pela nova arquitetura |

**Checklist da virada:**
- [ ] Todos os 301 da tabela de migração aplicados e testados
- [ ] `robots.txt` de produção permitindo; de preprod bloqueando
- [ ] `sitemap.xml` gerado com as rotas novas
- [ ] Canonical corrigido e apontando para o domínio final
- [ ] Google Search Console configurado para o domínio final, com o Wix mantido para acompanhar os 301
- [ ] Schema `Organization`, `Book`/`Product` e `Event` validados no Rich Results Test
- [ ] `alt` em toda imagem (usar a biblioteca de imagens do documento 04)
- [ ] Open Graph com a capa correta por PDP

---

## 9. Métricas de sucesso

**90 dias:**
- Rankear **#1 em busca própria** para "ninfas do tietê", "natália nolli sasso", "selo libertária", "sarau safado" — hoje o selo perde as próprias buscas para marketplaces
- 3 PDPs indexadas com resultado rico de livro
- `/sarau-safado` aparecendo como evento no Google

**180 dias:**
- Pilar de literatura erótica no top 10 para a busca principal
- Tráfego orgânico ≥ 3× a linha de base do Wix
- Inscrições na newsletter como métrica primária (é o canal que avisa pré-venda e sarau)

**O que não medir:** volume bruto de pageview. Um selo com três títulos não vive de tráfego — vive de quem compra o livro e quem aparece no sarau.

---

**Fontes consultadas**

- [Selo Libertária — site antigo (Wix)](https://natalianolli5.wixsite.com/website-1)
- [Selo Libertária — domínio oficial](https://www.selolibertaria.com.br/)
- [Selo Libertária — preprod](https://preprod.selolibertaria.com.br/)
- [Ninfas do Tietê — Livraria da Travessa](https://www.travessa.pt/Artigo/Detalhe/ninfas-do-tiete/artigo/3e8145e7-f83a-453c-b593-212fa84ea600)
- [Ninfas do Tietê — Livraria Taverna](https://livrariataverna.com.br/poesia/1316-ninfas-do-tiete-natalia-nolli-sasso-9788592579814.html)
- [Quando o erotismo é chama libertária — Outras Palavras](https://outraspalavras.net/outrosquinhentos/quando-o-erotismo-e-chama-libertaria/)
- [Ninfas do Tietê — São Paulo Review](http://saopauloreview.com.br/ninfas-do-tiete/)
- [Natália Nolli Sasso — Escavador](https://www.escavador.com/sobre/763338/natalia-nolli-sasso)
