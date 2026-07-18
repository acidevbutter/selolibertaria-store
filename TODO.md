# TODO — Selo Libertária Editorial V2

## Escopo ativo

Esta lista substitui o modo antigo “Technical Requirements Only” para a rodada atual.

A tarefa atual permite alterações de copy, design e estrutura visual quando forem necessárias para alinhar o site público ao Selo Libertária / Figma Editorial V2.

Preservar:

- catálogo;
- PDP;
- carrinho;
- checkout;
- conta;
- favoritos;
- admin;
- Stripe;
- Mongo;
- rotas existentes, salvo tarefa específica.

## P0 — Base pública e fork cleanup

- [ ] Corrigir Header/Footer para o menu oficial: Livros, Projetos, Sarau Safado, Sobre, Contato.
- [ ] Garantir que `Comprar` aparece como CTA, não menu.
- [ ] Remover `Eventos` do menu principal, mantendo a rota/conteúdo acessível por Sarau/Home/footer.
- [ ] Corrigir labels visíveis em inglês na interface pública.
- [ ] Corrigir placeholders, aria-labels, estados vazios, loading e erros públicos quando estiverem em inglês.
- [ ] Remover marcas, demos e textos visíveis herdados do fork nas superfícies tocadas.
- [ ] Não renomear rotas para português ainda.

## P1 — Home Figma Editorial V2

- [ ] Ajustar estrutura da Home: Header, Hero, Manifesto, Produto em destaque, Catálogo curto, Sarau Safado, Newsletter/Footer.
- [ ] Reforçar capa/livro como protagonista.
- [ ] Garantir CTA principal de compra na primeira dobra.
- [ ] Reduzir blocos extras que enfraquecem fidelidade ao Figma.
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
- [ ] Não quebrar variantes, Stripe, favoritos ou carrinho.

## P4 — Admin editorial e backoffice

- [ ] Auditar se campos salvos no admin aparecem no site.
- [ ] Validar imagem hero do Sarau Safado.
- [ ] Validar imagens de events/projects no público.
- [ ] Remover copy híbrida inglês/pt-BR em telas administrativas tocadas.
- [ ] Manter hub editorial e padrões existentes.

## P5 — Design system incremental

- [ ] Consolidar tokens Editorial V2 quando necessário.
- [ ] Extrair componentes apenas quando houver repetição real.
- [ ] Evitar reescrita ampla sem ganho de manutenção.
- [ ] Manter componentes de comércio funcionais.

## P6 — QA final

- [ ] Testar mobile 390px, 768px, 1024px e 1440px.
- [ ] Validar menu mobile.
- [ ] Validar reload direto das rotas públicas existentes.
- [ ] Verificar contraste, headings, alt text, focus e labels.
- [ ] Rodar `yarn lint`, `yarn test`, `yarn build` e `tsgo` quando disponíveis.
- [ ] Reportar qualquer falha ou comando indisponível.
- ## P3.75B — Fechado em 2026-06-27
- [x] `/projects` ligado a `page_projects`.
- [x] `/products` ligado a `page_products`.
- [x] Blocos editoriais de `/product/[slug]` ligados a `page_product`.
- [x] `/about`, `/contact`, newsletter e footer ligados ao editorial/admin.
- [x] `site_global` adotado para newsletter e rodapé públicos.
- [x] Migration editorial segura por campos ausentes.
- [x] Build preparado para migration opcional com `RUN_EDITORIAL_MIGRATIONS=true`.



[ ] Permitir a alteração da fonte, tamanho, cor, estilo em cada bloco
[ ] Erros de tipagem
[ ] Build nao passou
[ ] Mudar de livros para lojas
[ ] Reativar sistema de varinates de produtos
[ ] Preço n esta colocando decimais
[ ] Validar pix, apple pay, gpay, etc
[ ] erramentas:
[ ] Editor de texto 
[ ] Editor de imagens
[ ] Editor de fundo/tela de fundo
[ ] Portfólio 
[ ] Ajustar “contato” subir pro site online 
[ ] Sobre: cards
[ ] Trocar “livros” por “loja”
[ ] Envio de livros : prazo real envio módico correio
