# 00-INDEX — Slices de implementação do novo design (Selo Libertária)

Fonte: meta-prompt de fatiamento + `Canvas Selo Libertaria` (Claude Design, projeto `018e9063-10de-4a25-81c9-d51db44f8613`).
Ler `00-CONTEXT.md` primeiro — ele existe para nenhum slice redescobrir o projeto.

## Regra de modelo

Começar todo slice no **modelo padrão** (Sonnet ou equivalente). Escalar para o **modelo de raciocínio**
(Opus ou equivalente, com plano antes de codar) só se o próprio plano do agente indicar mais de 6 arquivos
tocados ou mudança de contrato de dados. Os slices 01, 07, 08 e 09 já nascem no modelo de raciocínio porque
essas condições são conhecidas de antemão (fundação que tudo herda; frete e pagamento envolvem dinheiro real
e mudança de fluxo).

## Slices

| # | Slice | Modelo | Depende de | Canvas | Custo | Status |
|---|---|---|---|---|---|---|
| 01 | Fundação: tokens, fontes locais, reset `radius:0`, `Button`, `Field`, `Badge`, `PriceBlock` | raciocínio | — | 2a, 2e | alto | todo |
| 02 | Shell: `Nav` (busca, carrinho com contador) + `Footer`, ajuste de labels/menu | 01 | padrão | 2b, 2e | médio | todo |
| 03 | `ProductCard` único + `CategoryFilterBar` | padrão | 01 | 2b, 2e | médio | todo |
| 04 | Home multicategoria: hero de lançamento + faixa de categorias + "Em destaque" | padrão | 02, 03 | 2b | médio | todo |
| 05 | `/loja` (catálogo): grid, filtros, ordenação, estados vazio/carregando | padrão | 03 | 2c | médio | todo |
| 06 | PDP `/product/[slug]`: galeria 1:1, painel de compra, ficha, relacionados | padrão | 03 | 2c | médio | todo |
| 07 | Carrinho + cálculo de frete no carrinho | raciocínio | 03 | 2d | alto | todo |
| 08 | Checkout: 3 etapas em acordeão + resumo persistente | raciocínio | 07 | 2d | alto | todo |
| 09 | Elementos de pagamento: cartão, Pix, boleto, cupom, bandeiras, erro/sucesso | raciocínio | 08 | 2f | alto | todo |
| 10 | Editoriais: `/projects`, `/sarau-safado`, `/events`, `/about`, `/contact`, `/faq` | rápido/barato | 02 | 1a-… (adaptar) | baixo | todo |
| 11 | Conta e admin: `/login`, `/user`, `/admin` sob o sistema novo | padrão | 01, 02 | seção 06 | médio | todo |
| 12 | QA final: contraste 4.5:1, alvos 44px, teclado, `radius:0` residual, LCP/CLS, meta/OG | rápido/barato | todos | 2a | baixo | todo |

## Divergências desta geração em relação à sequência-base do meta-prompt

1. **Sem acesso ao vivo ao Canvas** nesta sessão (`/design-login` exige sessão interativa). Todos os campos
   `canvas:` dos slices abaixo citam a seção (`2a`…`2f`) mas **não** faixas de linha reais — cada slice tem
   uma checklist item para confirmar isso antes de codar. Ver aviso no topo de `00-CONTEXT.md`.
2. **Categorias do canvas não existem no modelo de dados atual** (catálogo hoje é essencialmente mono-categoria
   "livros"). Isso pode inflar os slices 03/04/05 além do orçamento de ~6 arquivos/~400 linhas — se o agente do
   slice 03 identificar que precisa mexer em schema/queries de catálogo, ele deve **parar e declarar em
   `PROGRESS.md`** em vez de absorver a mudança de contrato de dados num slice pensado para UI.
3. **Frete no carrinho antes do checkout é mudança de fluxo**, não só de layout (hoje a cotação Melhor Envio
   acontece dentro do `/checkout`). Por isso o slice 07 já nasce no modelo de raciocínio e carrega uma seção
   extra de "Decisão de produto" no próprio prompt, além do que o formato padrão exige.
4. **`DCC-Ash.otf` não está no repositório.** O slice 01 bloqueia na etapa de tipografia até alguém anexar a
   fonte — está marcado explicitamente na definição de pronto do slice 01 e não deve ser contornado com uma
   fonte substituta sem aprovação.
5. Slice 02 do meta-prompt original inclui "rota `/loja` e renomeações"; mantive isso dentro do slice 02, mas
   sinalizei no próprio prompt que renomear a rota pública de `/products` para `/loja` é uma mudança de URL/SEO
   e deve ser confirmada como intencional antes de mexer em redirects.

## Protocolo de execução

1. Abrir uma conversa nova por slice — não reaproveitar histórico.
2. Colar o conteúdo de `prompts/NN-slug.md` como primeira mensagem.
3. O agente lê `00-CONTEXT.md` + `PROGRESS.md` (não o canvas inteiro) antes de codar.
4. Ao terminar, o agente atualiza `PROGRESS.md` (≤5 linhas: arquivos tocados + decisões) e abre PR.
5. Marcar o status do slice nesta tabela (`todo` → `em progresso` → `feito`) antes de iniciar o próximo.
