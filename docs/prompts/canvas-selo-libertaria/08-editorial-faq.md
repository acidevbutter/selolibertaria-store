---
slice: 10 (revisado — só /faq precisa de trabalho)
titulo: "/faq — único editorial que ainda não foi migrado para a gramática do Canvas"
modelo: rápido/barato
depende_de: ["01-fundacao-tokens-componentes.md"]
arquivos_previstos:
  - src/app/faq/page.tsx
---

## Por que só este arquivo (e não os outros 5 editoriais)

A auditoria em `README.md` confirmou, por leitura de arquivo, que `/projects`, `/sarau-safado`,
`/events`, `/about` e `/contact` já implementam a gramática do Canvas: hero dominante em
`--editorial-ink`/`--editorial-paper`, poucas seções alternando papel/preto/bege, fechamento único
antes do `<Footer />`. Isso confirma que `docs/design/userinterface.md` (atualização 2026-06-24,
linha 176) estava certo — essas 5 páginas já foram migradas, provavelmente numa sessão anterior a
esta auditoria e a `prompts/00-INDEX.md`. **Não mexer nessas 5 páginas.**

`/faq` (`src/app/faq/page.tsx`) é a exceção genuína, e nunca foi citada nessa atualização — a
lista de páginas do doc é só "Catálogo, Projetos, Sarau Safado, Sobre e Contato". Confirmado por
leitura: o hero de `/faq` ainda usa

```
bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.46),transparent_36%),
    linear-gradient(180deg,#220607_0%,#050203_100%)]
```

— zero tokens `--editorial-*`, design de uma geração anterior (vermelho/preto genérico, não o
preto/papel/vinho do Canvas).

## Escopo

Reescrever `src/app/faq/page.tsx` seguindo o mesmo padrão já usado nas 5 páginas irmãs — usar
`/projects/page.tsx` como referência mais próxima de estrutura (hero dominante + 1-2 seções +
fechamento), adaptado ao conteúdo de FAQ:

1. Hero com `EditorialShell`, fundo `--editorial-ink` (ou `--editorial-paper`, dependendo do
   contraste desejado — seguir o padrão de alternância, olhar o que a página anterior no fluxo de
   navegação usa por último para não repetir a mesma cor duas vezes seguidas), eyebrow +
   título + descrição, mesma estrutura de `EditorialEyebrow`/`EditorialRichText` já usada nas
   outras páginas.
2. Bloco do acordeão de perguntas (`FaqAccordion`, já existe em
   `src/ui/faq/faq-accordion.client.tsx` — não recriar, só re-envolver com `EditorialPanel`/
   `EditorialShell` no lugar do atual `border-border/60 bg-card/60`).
3. Manter as 4 perguntas/respostas existentes (`items.payment`, `items.tracking`,
   `items.customWork`, `items.contact` em `messages/pt-BR.json`, namespace `/faq.page`) — não
   inventar novo conteúdo de FAQ, só re-skinar a moldura.
4. Considerar (opcional, se fizer sentido para "fechamento único antes do footer") adicionar uma
   seção final de CTA curta (ex.: "Não achou sua dúvida? Fale com o selo" → `/contact`), seguindo o
   mesmo padrão das outras 5 páginas — mas só se isso não inflar o escopo além de um re-skin.

## Critérios de aceite

- [ ] `yarn lint` e `yarn build` passam.
- [ ] `/faq` usa `--editorial-ink`/`--editorial-paper`/`--editorial-beige`/`--editorial-accent`,
      zero classes `rounded-*`, zero cor hex nova fora dos tokens já definidos.
- [ ] `FaqAccordion` continua funcional (abrir/fechar perguntas) sem mudança de comportamento.
- [ ] As 4 perguntas/respostas de `messages/pt-BR.json` continuam intactas (nenhuma string nova
      inventada).
- [ ] Contraste mínimo 4.5:1 mantido no novo hero (checagem visual rápida, não é a auditoria
      completa de QA da slice 12).
- [ ] Atualizar `prompts/PROGRESS.md`.

## O que não fazer

- Não tocar em `/projects`, `/sarau-safado`, `/events`, `/about`, `/contact` — já estão prontos.
- Não inventar novo conteúdo de FAQ nem mudar as chaves de tradução existentes.
- Não mudar a lógica do `FaqAccordion` (`src/ui/faq/faq-accordion.client.tsx`) — só a moldura ao
  redor dele.
