# UI & UX Patterns — Selo Libertária

## Objetivo

Consolidar os padrões de interface e experiência para o Selo Libertária, evitando conflito entre fork herdado, Figma Editorial V2, admin existente e prompts soltos.

## Princípios globais

1. O produto é híbrido: loja + editorial + admin.
2. A loja não pode ser sacrificada pelo manifesto.
3. O editorial não pode parecer enxerto sobre um ecommerce genérico.
4. O admin precisa ser operacional e claro.
5. O design deve ser adulto, literário, cultural e não caricato.

## Direção visual ativa

**Editorial V2**, versão clara/tátil de **Editorial Noturno**.

Paleta:

- Papel: `#F7F4EF`
- Preto: `#0B0B0B`
- Vinho seco: `#7A1E22`
- Bege envelhecido: `#D8D0C4`

Características:

- capas grandes;
- bordas retas;
- respiro;
- alto contraste;
- ritmo de revista/livro;
- CTAs comerciais claras;
- microcopy curatorial curta.

Evitar:

- visual SaaS no público;
- e-commerce clean genérico;
- sex-shop clichê;
- excesso de vermelho;
- excesso de animação;
- marcas ou demos herdadas do fork.

## Menu e navegação

Menu público oficial:

```text
Livros
Projetos
Sarau Safado
Sobre
Contato
```

Regras:

- `Comprar` é CTA.
- `Eventos` é conteúdo secundário, acessível por Sarau/Home/footer.
- FAQ/Termos/Privacidade ficam no footer.
- Labels podem ser localizados sem trocar rotas.

## Home

A Home Editorial V2 deve ser direta e encadeada:

1. Header.
2. Hero com livro/capa dominante.
3. Manifesto.
4. Livro em destaque.
5. Catálogo curto.
6. Sarau Safado.
7. Newsletter/Footer.

A primeira dobra precisa unir:

- posicionamento;
- livro/produto;
- CTA de compra;
- atmosfera editorial.

Evitar empilhar blocos institucionais extras antes do footer quando a tarefa for fidelidade ao Figma.

## Catálogo / Livros

A listagem deve parecer prateleira curada, não grade de atacado.

Padrões:

- entrada editorial curta antes da grade;
- cards com capa protagonista;
- título legível;
- preço/status claro;
- favorito e quick action sem atrapalhar clique do card;
- microcopy curatorial quando disponível;
- mobile sem depender de hover.

## PDP / Página de livro

Topo:

- capa/galeria forte;
- título;
- autora;
- preço/status;
- variantes;
- CTA de compra;
- favorito.

Abaixo:

- sinopse;
- trecho literário;
- ficha técnica;
- continuidade para catálogo/projetos/Sarau/eventos.

A compra vem primeiro, mas a atmosfera editorial deve continuar depois da dobra.

## Páginas institucionais

`events`, `projects`, `sarau-safado`, `about` e `contact` não devem ser só listas homogêneas.

Cada página precisa de:

1. hero ou entrada forte;
2. bloco curatorial/contextual;
3. conteúdo principal;
4. saída/continuidade.

### Sarau Safado

- Se houver `hero.image`, usar como capa de fundo.
- Proteger legibilidade com gradiente/bloco de contraste.
- Mostrar contexto, sinais curatoriais, notas de programação, agenda/memória e links.

### Events / Projects

- Usar imagem principal quando cadastrada.
- Cards devem alternar resumo e descrição para não virar mural monótono.
- Manter ordem/publicação vindas do admin.

## Login

Login Editorial V2 deve parecer entrada no universo do site:

- header editorial;
- formulário em papel;
- CTA primária forte;
- OAuth subordinado;
- visual/capa/livro como painel de apoio;
- cadastro em etapas quando aplicável.

Não usar card SaaS genérico centralizado se a tarefa for rebrand visual.

## Admin

O admin deve parecer um caderno editorial operacional:

- sidebar preta fixa;
- área principal em papel claro;
- hero curto por tela;
- métricas/contexto antes de tabelas densas;
- cards retos;
- acento vinho discreto;
- copy operacional em `pt-BR`.

Evitar:

- labels híbridas em inglês;
- termos técnicos quando não ajudam;
- CTAs genéricas como `Abrir` quando `Ver pedido`, `Editar livro` ou `Salvar promoção` orientam melhor.

## Formulários e uploads

- Formulários longos em seções curtas.
- Inputs com largura proporcional ao dado.
- Ajuda curta abaixo do campo, sem repetir o label.
- Slugs autoformatados quando a superfície já usa esse padrão.
- Upload por arquivo com prévia e confirmação.
- `Salvar`/`Descartar` em modal de revisão de imagem.

## Idioma

Para Selo Libertária público, `pt-BR` é primário.

Ao corrigir uma superfície, revisar:

- labels;
- CTAs;
- placeholders;
- aria-labels;
- empty states;
- loading;
- toasts;
- erros.

Não traduzir automaticamente conteúdo vindo do admin.

## Acessibilidade

Checklist mínimo:

- contraste suficiente;
- foco visível;
- um `h1` por página;
- labels em inputs;
- alt text em imagens;
- botões com nome acessível;
- menu mobile operável;
- não depender apenas de hover.

## Motion

- Reveals discretos.
- Hover lift leve.
- Respeitar `prefers-reduced-motion`.
- Não transformar storefront/admin em interface nervosa.
