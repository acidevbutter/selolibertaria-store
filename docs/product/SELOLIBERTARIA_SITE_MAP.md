# Mapeamento do Selo Libertária

> Revisado em 2026-09-24 contra `selolibertaria-store/src/app/` e `src/lib/public-navigation.ts`
> atuais. O menu principal e as rotas de conteúdo abaixo continuam batendo com o código; a
> principal mudança desde a versão anterior é a chegada de rotas comerciais fora do menu
> principal (pré-venda) — ver seção "Rotas comerciais e funcionais fora do menu".

## Objetivo

Consolidar o mapa editorial e comercial do Selo Libertária sem misturar a navegação do Wix antigo, as rotas técnicas do fork e o menu final do produto atual.

## Natureza da marca

- Editora e produtora cultural.
- Literatura erótica, performance, livros, livros sonoros, eventos e projetos autorais.
- Tom editorial, íntimo, adulto, poético e autoral.
- A loja é parte da experiência, não um anexo frio.

## Menu público oficial

O menu principal atual deve ser:

```text
Loja
Projetos
Sarau Safado
Sobre
Contato
```

Regras:

- `Comprar` é CTA.
- `Eventos` é conteúdo/rota secundária, não item principal do menu.
- `FAQ`, `Termos`, `Privacidade` e links sociais pertencem ao footer ou navegação auxiliar.

## Mapeamento entre conceito, rota e função

| Item visual | Rota atual | Função |
| --- | --- | --- |
| Loja | `/products` (+ `/category/[slug]`, `/product/[slug]`) | Comprar e explorar livros e demais produtos |
| Projetos | `/projects` (+ `/projects/[slug]`) | Portfólio cultural e ações editoriais |
| Sarau Safado | `/sarau-safado` | Página dedicada ao sarau, agenda/memória/contexto |
| Sobre | `/about` | Manifesto, autoria, selo, linha editorial |
| Contato | `/contact` | Formulário, email, redes e assuntos de contato |
| Eventos | `/events` | Agenda/acervo, acessível por Sarau/Home/footer |
| FAQ | `/faq` | Navegação auxiliar/legal |
| Termos | `/terms` | Legal/footer |
| Privacidade | `/privacy` | Legal/footer |

Rotas conferidas em `src/lib/public-navigation.ts` (fonte única do menu principal no código) —
não renomear rotas para português sem tarefa explícita de redirects/canonical/SEO.

## Rotas comerciais e funcionais fora do menu

Não fazem parte do menu principal (mesmo padrão de "Eventos": conteúdo/rota secundária), mas
existem e são navegáveis hoje:

| Rota | Função |
| --- | --- |
| `/pre-venda/little-fish-big-fish` | Página pública de pré-venda de um produto específico (sistema de pré-venda "little fish, big fish") |
| `/checkout`, `/checkout/prepare`, `/checkout/processing`, `/checkout/return` | Fluxo de checkout |
| `/login`, `/reset-password`, `/account/access` | Autenticação e recuperação de conta |
| `/orders`, `/user/*` | Área logada: pedidos e perfil do usuário |
| `/search` | Busca de catálogo |
| `/maintenance` | Página exibida quando a loja está desativada (ver `site_activation` no backend) |

## Conteúdo herdado do site Wix

### Início

- Boas-vindas ao Selo Libertária.
- Apresentação como editora/produtora cultural dedicada à literatura.
- Convite para loja, eventos, projetos e trajetória do selo.

### Loja

- Livros impressos e sonoros.
- Destaque para publicações de Natália Nolli Sasso.
- Contexto sobre edições, premiações, ilustrações e distribuição.
- A página nova deve ser mais comprável e mais editorial ao mesmo tempo.

### Eventos

- Registros visuais e agenda/acervo.
- Deve existir como rota/conteúdo, mas pode ser subordinado a Sarau Safado ou Home na navegação principal.

### Projetos / Portfólio

Projetos identificados como referência de conteúdo:

- Festival Mário de Andrade
- Laboratório de escritas dissidentes
- Sarau Levante
- Flipenha
- Livro de Vênus
- Lançamento de `Ninfas do Tietê`
- Sarau Safado

### Sarau Safado

- Página dedicada.
- Começou online e virou presencial.
- Encontro de pessoas que escrevem, pesquisam, leem e se interessam por literaturas eróticas.
- Deve trazer hero forte, contexto, agenda/memória, sinais curatoriais e links de continuidade.

### Contato

- Formulário simples.
- Email e redes.
- Assuntos de contato sugeridos:
  - Comprar livro
  - Enviar manuscrito
  - Projetos
  - Sarau Safado
  - Imprensa
  - Outro

## Direção de redesign

Manter:

- autoria como eixo central;
- linguagem poética;
- imagens como âncoras editoriais;
- navegação curta;
- relação entre livro, corpo, cidade e performance.

Modernizar:

- grids mais consistentes;
- cards de livros/projetos/eventos;
- compra mais clara;
- visual Editorial V2;
- mobile mais seguro;
- admin conectado ao que aparece publicamente.

## Estrutura pública recomendada

1. Home
2. Catálogo/Loja
3. PDP/Página de livro
4. Projetos
5. Sarau Safado
6. Eventos/acervo
7. Sobre
8. Contato
9. FAQ/Termos/Privacidade no footer

## Observação técnica

O produto atual já tem arquitetura de loja e editorial. Este mapa não deve ser usado para recriar o projeto do zero; ele orienta limpeza, rotulagem, hierarquia e aderência de conteúdo.
