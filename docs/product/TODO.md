# TODO — Selo Libertária

## Escopo ativo

A tarefa atual permite alterações de copy, design e estrutura visual quando forem necessárias para alinhar o site público ao **Canvas Selo Libertaria** (Claude Design, projeto `018e9063-10de-4a25-81c9-d51db44f8613`, arquivo `Canvas Selo Libertaria.dc.html`) — referência visual única a partir de agora, substituindo qualquer material de Figma anterior.

Preservar:

- catálogo;
- PDP;
- carrinho;
- checkout;
- conta;
- favoritos;
- admin;
- Mercado Pago;
- Mongo;
- rotas existentes, salvo tarefa específica.

## P0 — Base pública e fork cleanup

- [ ] Corrigir Header/Footer para o menu oficial: Loja, Projetos, Sarau Safado, Sobre, Contato.
- [ ] Garantir que `Comprar` aparece como CTA, não menu.
- [ ] Remover `Eventos` do menu principal, mantendo a rota/conteúdo acessível por Sarau/Home/footer.
- [ ] Corrigir labels visíveis em inglês na interface pública.
- [ ] Corrigir placeholders, aria-labels, estados vazios, loading e erros públicos quando estiverem em inglês.
- [ ] Remover marcas, demos e textos visíveis herdados do fork nas superfícies tocadas.
- [ ] Não renomear rotas para português ainda.

## P1 — Home (Canvas Selo Libertaria)

- [ ] Ajustar estrutura da Home: Header, Hero, Manifesto, Produto em destaque, Catálogo curto, Sarau Safado, Newsletter/Footer.
- [ ] Reforçar capa/livro como protagonista.
- [ ] Garantir CTA principal de compra na primeira dobra.
- [ ] Reduzir blocos extras que enfraquecem fidelidade ao Canvas Selo Libertaria.
- [ ] Manter conteúdo administrável/fallback onde já existir.

## P2 — Páginas editoriais existentes

- [ ] Revisar `/projects`.
- [ ] Revisar `/events`.
- [ ] Revisar `/sarau-safado`.
- [ ] Revisar `/about`.
- [ ] Revisar `/contact`.
- [ ] Usar melhor imagens principais de events/projects.
- [ ] Reduzir copy fixa quando o admin já controla o conteúdo.
- [ ] Garantir links de continuidade para catálogo/Sarau/projetos/contato.

## P3 — PDP / Página de livro

- [ ] Reforçar capa/galeria no topo.
- [ ] Garantir compra clara.
- [ ] Adicionar/organizar sinopse, trecho, ficha técnica e continuidade editorial quando disponível.
- [ ] Não quebrar variantes, Mercado Pago, favoritos ou carrinho.

## P4 — Admin editorial e backoffice

- [ ] Auditar se campos salvos no admin aparecem no site.
- [ ] Validar imagem hero do Sarau Safado.
- [ ] Validar imagens de events/projects no público.
- [ ] Remover copy híbrida inglês/pt-BR em telas administrativas tocadas.
- [ ] Manter hub editorial e padrões existentes.
- [ ] Permitir alteração de fonte, tamanho, cor e estilo em cada bloco.
- [ ] Ferramenta: editor de texto.
- [ ] Ferramenta: editor de imagens.
- [ ] Ferramenta: editor de fundo/tela de fundo.
- [ ] Ferramenta: portfólio.

## P5 — Design system incremental

- [ ] Consolidar tokens do Canvas Selo Libertaria quando necessário.
- [ ] Extrair componentes apenas quando houver repetição real.
- [ ] Evitar reescrita ampla sem ganho de manutenção.
- [ ] Manter componentes de comércio funcionais.

## P6 — Bugs e pendências funcionais

- [ ] Erros de tipagem no projeto.
- [ ] Build não está passando.
- [ ] Reativar sistema de variantes de produtos.
- [ ] Preço não está exibindo casas decimais.
- [ ] Validar Pix, Apple Pay, Google Pay etc.
- [ ] Ajustar página de contato e publicar no site online.
- [ ] Cards da página "Sobre" pendentes.
- [ ] Prazo real de envio (Correios) no lugar do valor módico atual.

## P7 — QA final

- [ ] Testar mobile 390px, 768px, 1024px e 1440px.
- [ ] Validar menu mobile.
- [ ] Validar reload direto das rotas públicas existentes.
- [ ] Verificar contraste, headings, alt text, focus e labels.
- [ ] Rodar `yarn lint`, `yarn test`, `yarn build` e `tsgo` quando disponíveis.
- [ ] Reportar qualquer falha ou comando indisponível.

## Concluído — P3.75B (2026-06-27)

- [x] `/projects` ligado a `page_projects`.
- [x] `/products` ligado a `page_products`.
- [x] Blocos editoriais de `/product/[slug]` ligados a `page_product`.
- [x] `/about`, `/contact`, newsletter e footer ligados ao editorial/admin.
- [x] `site_global` adotado para newsletter e rodapé públicos.
- [x] Migration editorial segura por campos ausentes.
- [x] Build preparado para migration opcional com `RUN_EDITORIAL_MIGRATIONS=true`.
