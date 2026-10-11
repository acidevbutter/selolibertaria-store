# Design System do Admin — Selo Libertária

Definido a partir do **turno 1** (diagnóstico: o painel tem dois sistemas visuais convivendo) e do **turno 2** (especificação decidida nos bugs #6–#9 e no login 2g) do arquivo `Canvas Admin Selo Libertaria.dc.html`.

Regra de origem: **o admin fala a língua da loja.** Onde o fork trouxe shadcn (raio 12px, branco, badges verde/vermelho, campo de 40px), vale o vocabulário editorial. O admin só divergiu do público em um ponto — e foi decidido que não diverge: **raio zero em tudo**.

---

## 1. Cores

| Token | Hex | Uso |
|---|---|---|
| Papel | `#F7F4EF` | fundo de tela e de cartão |
| Papel de campo | `#FFFFFF` | interior de input, textarea, select |
| Bege | `#D8D0C4` | barra de ferramentas, rodapé de ação, badge neutro, hover secundário |
| Tinta | `#0B0B0B` | texto, sidebar, botão principal |
| Vinho | `#7A1E22` | ação destacada, eyebrow, link, erro, estado crítico |
| Vinho claro | `#B3282E` | alerta sobre fundo escuro (só em anotação de canvas) |

**Proibido:** verde/vermelho de status do shadcn (`#dcfce7`/`#166534`, `#fee2e2`/`#991b1b`), cinzas `#e4e4e7`/`#71717a`/`#f4f4f5`, hex crus herdados do fork (`#fffdf8`, `#fbf7f1`, `#ded5ca`, `#18181b`). Status se resolve em bege, tinta e vinho.

Filetes: `rgba(11,11,11,.12)` em cartão/superfície · `rgba(11,11,11,.2)` em régua e divisor · `rgba(11,11,11,.3)` em campo e botão secundário.

## 2. Raio

**Zero.** Sem exceção — nem sidebar, nem badge, nem avatar, nem cartão. Foi o achado 21 do turno 1 e a decisão do bug #9.

## 3. Tipografia

- **Títulos:** Fertigo, `font-weight:900`, `text-transform:uppercase`, `letter-spacing:-.04em` a `-.05em`, `line-height:.9`–`.92`. Escala: 76px (canvas), 44px (tela), 36px (cartão).
- **Números e identificadores:** DCC Ash — valor monetário, contagem, número de pedido, numeral de passo. Foi o bug #6.
- **Corpo:** Fertigo, 15–17px, `line-height:1.7`.
- **Eyebrow:** 10px / 900 / `.28em` / uppercase, em vinho.
- **Rótulo de campo:** 10px / 900 / `.24em` / uppercase, em `rgba(11,11,11,.6)`.
- **Rótulo de botão:** 11px / 900 / `.24em` / uppercase.
- **Rótulo de badge:** 10px / 900 / `.2em` / uppercase.

## 4. Componentes

**Campo** — altura 52px, fundo `#FFFFFF`, filete `rgba(11,11,11,.3)`, texto 16px, padding lateral 14px, raio zero.
- Foco: filete `#0B0B0B` sólido + halo `0 0 0 2px rgba(122,30,34,.2)`.
- Erro: filete `rgba(122,30,34,.3)`, fundo `rgba(122,30,34,.06)`, mensagem em vinho, 13px.

**Botão principal** — altura 48px, fundo `#0B0B0B`, texto `#F7F4EF`, rótulo 11px/900/.24em.
**Botão de ação destacada** — igual, fundo vinho `#7A1E22`.
**Botão secundário** — altura 48px, fundo `#FFFFFF`, filete `rgba(11,11,11,.3)`, texto tinta. Hover: fundo bege.
**Carregando** — troca o rótulo por texto ("Abrindo o Google…", "Enviando…"). Nada gira.

**Badge de status** — altura 24–26px, padding `0 10px`, rótulo 10px/900/.2em, raio zero.
- Neutro / concluído: fundo bege, texto vinho.
- Em curso / enviado: fundo tinta, texto papel.
- Falha / atenção: fundo `rgba(122,30,34,.12)`, filete `rgba(122,30,34,.4)`, texto vinho.

**Cartão / superfície** — fundo papel ou `#FFFFFF`, filete `rgba(11,11,11,.12)`, padding 16–24px, raio zero, sem sombra.

**Tabela** — cabeçalho em bege, rótulos 10px/900/.18em uppercase, linhas separadas por `rgba(11,11,11,.08)`, valor monetário em DCC Ash. Um único componente compartilhado (bug #8).

**Sidebar** — fundo tinta, largura 264–280px, item 36px, selecionado **sólido em papel com texto tinta**, raio zero, grupos com rótulo 9px/900/.26em em vinho claro.

**Rodapé de ação** — faixa bege no rodapé do cartão, texto de estado à esquerda ("Rascunho salvo às 14:32"), botões à direita.

## 5. Escrita

Português direto, segunda pessoa, sem jargão. Vazio explica ("Nenhum produto encontrado."), erro diz o que fazer ("Tente de novo ou redefina a senha — o carrinho fica salvo."). Vocabulário único: **Produto** (nunca "livro" — o catálogo é misto: livro, zine, edição sonora, objeto, ingresso), **Formato** (não "categoria" — o eixo útil do catálogo é o formato), **Clientes**, **Pagamentos recebidos**, **Páginas**.

## 6. Onde este sistema está aplicado

- `Canvas Admin Selo Libertaria.dc.html` — turnos 1 e 2 (origem), turno 3 (diagnóstico), turno 4 (proposta editorial)
- `Fase 1 - Midia e Imagem.dc.html`
- `Fase 2 - Editor de Blocos.dc.html`
- `Fase 3 - Promocoes.dc.html`
- `Fase 4 - Navegacao e Listas.dc.html`
- `Promocao Assistente B.dc.html` · `Home Admin A.dc.html` (layouts escolhidos)
