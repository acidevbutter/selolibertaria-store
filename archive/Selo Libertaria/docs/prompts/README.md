# Prompts de implementação — Admin Selo Libertária

Fatias derivadas do `Canvas Admin Selo Libertaria.dc.html` (turnos 1–4) e dos canvas `Fase 1` a `Fase 4`.

---

## 0. Importar o design antes de codar

Cole isto no Claude Code. Os arquivos vivem no projeto de design **Selo Libertaria**; puxe-os pelo MCP conectado (ou baixe o zip do projeto e aponte para a pasta local).

```
Importe do projeto de design "Selo Libertaria" estes arquivos, na ordem:

# regra — leia primeiro, vale para tudo
guidelines/admin-design-system.md

# tokens — a fonte dos valores, não reescreva à mão
tokens/colors.css
tokens/typography.css
tokens/controls.css
tokens/spacing.css
tokens/fonts.css
assets/fonts/DCC-Ash.otf
assets/fonts/FertigoPro-Regular.otf

# origem do sistema (turnos 1 e 2) e diagnóstico (turno 3)
Canvas Admin Selo Libertaria.dc.html

# telas por fatia
Fase 1 - Midia e Imagem.dc.html
Fase 2 - Editor de Blocos.dc.html
Fase 3 - Promocoes.dc.html
Fase 4 - Navegacao e Listas.dc.html

# layouts aprovados
Promocao Assistente B.dc.html
Home Admin A.dc.html

Não copie .dc.html para dentro do app — eles são referência de design.
Extraia deles os valores (hex, altura, letter-spacing, microtexto) e implemente
em React/Tailwind no padrão do repo. Copie apenas as fontes .otf.
```

## 1. Ordem e paralelismo

| Fatia | Depende de | Paralelo com | Sub-prompts |
|---|---|---|---|
| `00-design-system.md` | — | nada (é a base) | 00.1 → 00.4 |
| `01-midia-imagem.md` | 00 | 04 | 01.1 → 01.5 |
| `02-editor-blocos.md` | 01 | 03 | 02.1 → 02.5 |
| `03-promocoes.md` | 00 | 02, 04 | 03.1 → 03.5 |
| `04-navegacao-listas.md` | 00 | 01, 03 | 04.1 → 04.4 |

Cada arquivo de fatia termina em **Sub-prompts**: pedaços de um commit só, com aceite próprio. Rode um por vez e verifique o aceite antes do próximo — dentro de uma fatia eles são sequenciais, salvo onde o arquivo diz que dá para paralelizar.

## 2. Regras que valem para todas as fatias

- Raio zero. Nenhum `rounded-*` novo em tela de admin.
- Nenhum verde/vermelho de status do shadcn. Status é bege, tinta e vinho.
- Valor monetário, contagem e identificador em DCC Ash.
- Vocabulário: **Produto** (não "livro"), **Formato** (não "categoria"), **Clientes**, **Páginas**, **Pagamentos recebidos**.
- Nenhum hex cru novo: os valores saem de `tokens/` e do design system.
- Toda lista nova nasce com busca, filtro, paginação e vazio escrito.
- Erro fica na tela com o que fazer. Nunca toast que desaparece.
