# Goal 2: Melhorar a experiência do usuário admin

## Objetivo

Transformar o admin em uma superfície mais clara, rápida e segura de operar, reduzindo atrito em criação, edição, revisão e publicação.

Também faz parte deste objetivo usar o plugin do Figma para revisar, estruturar e prototipar as melhorias do admin, garantindo que a experiência visual e operacional seja pensada antes da implementação.

## Escopo

* Hub editorial
* Formulários de `events`, `projects`, `about`, `contact`, `home` e `sarau-safado`
* Admin de produtos e variantes
* Admin de imagens e uploads
* Admin de pedidos, emails, webhooks, promoções e settings
* Navegação, feedback de estado, confirmação e erros
* Protótipo/revisão visual do admin no Figma usando o plugin Figma

## Estratégia

1. Simplificar fluxos longos em blocos curtos e compreensíveis.
2. Melhorar hierarquia visual e leitura de estado.
3. Deixar ações críticas mais óbvias e feedback mais confiável.
4. Reduzir fricção em upload, preview, reorder, publish e save.
5. Revisar consistência entre telas para que o admin pareça um sistema único.
6. Usar o plugin Figma para redesenhar e validar as principais superfícies do admin antes ou durante a implementação.

## Entregáveis

* Revisão de UX do admin por superfície.
* Ajustes de layout, hierarquia e feedback.
* Consolidação de padrões de formulário, tabela, modal e painel lateral.
* Melhorias progressivas sem quebrar o fluxo atual.
* Protótipo ou refinamento visual no Figma das telas principais do admin.

## Status atual

- O shell editorial do admin foi consolidado nas superfícies principais de dashboard, pedidos, usuários, emails, webhooks, produtos, categorias, promoções, settings, templates de email e hub editorial.
- As jornadas de catálogo passaram a abrir com hero curto, contexto operacional e blocos mais previsíveis para formulário, variantes, histórico e ações rápidas.
- As superfícies editoriais do escopo da meta (`events`, `projects`, `about`, `contact`, `home` e `sarau-safado`) foram migradas para o mesmo enquadramento do restante do backoffice, incluindo lista, criação e edição quando aplicável.
- A superfície de `email-templates` deixou de ser um preview cru e passou a operar como biblioteca revisável com lista, busca, metadados e painel de preview.
- O fluxo de imagens e uploads permaneceu no modelo `upload-first` já existente, mas dentro de telas mais consistentes e com leitura operacional mais clara.
- Um artefato de revisão visual foi criado no Figma para esta rodada da Goal 2: [Selo Libertaria Admin Goal 2 Review](https://www.figma.com/design/jHjotPVsPCqtwVTqdL7bjl).

## Conclusão da meta

- A Goal 2 pode ser considerada concluída: o admin passou a se comportar como um sistema único, com hierarquia editorial compartilhada, melhor leitura de contexto, abertura mais clara das telas e revisão visual registrada no Figma.
- Melhorias posteriores de i18n fino, autoformatação, moeda única do ambiente e consistência textual seguem como continuação natural da Goal 4, não como pendência estrutural da Goal 2.
