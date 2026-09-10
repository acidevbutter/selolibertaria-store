# PROGRESS — Implementação do novo design (Selo Libertária)

Formato de entrada (uma por slice, ≤5 linhas):

```
## Slice NN — título
- data:
- arquivos tocados:
- decisões:
- dúvidas/bloqueios (se houver):
```

Regra: cada slice só lê este arquivo + `00-CONTEXT.md` — nunca o histórico da conversa anterior. Se travar,
escrever a dúvida aqui e parar, sem inventar API ou dado.

---

## Slice 04 — Home multicategoria: verificação de fidelidade + fix do evento em destaque
- data: 2026-09-08
- arquivos tocados: `src/app/(store)/page.tsx`
- decisões: Canvas segue inacessível nesta sessão (auth `/design-login` interativo indisponível headless, ver `docs/prompts/canvas-selo-libertaria/README.md`). Fidelidade conferida contra `src/styles/sl-tokens.css` (já importado do Canvas) + Home rodando ao vivo: paleta, linhas hairline, radius 0, faixa de categorias, CTA acima da dobra em 390px/1440px — tudo bate com o esperado. Corrigido bug real: `featuredEvent` pegava o primeiro evento publicado sem checar `status`, mostrando o evento de arquivo ("Data: Arquivo") em vez da edição atual do Sarau — filtro agora exclui `status === "arquivo"` (DEV-293, fechada nesta sessão). Aberta DEV-294 (produto "Cartografia do Desejo" sem imagem de capa — lacuna de conteúdo, não corrigida aqui).
- dúvidas/bloqueios: nenhum novo; D4 (categorias fixas do Canvas) segue sem decisão em `00-decisoes-pendentes.md`, faixa de categorias segue no fallback (b).

## Slice 04 — Home multicategoria: correções contra o Canvas real (acesso liberado por /design-consent)
- data: 2026-09-08
- arquivos tocados: `src/ui/home/sl/sl-home-category-band.tsx`, `sl-home-manifesto.tsx`, `sl-home-hero.tsx`, `src/ui/sl/sl-button.tsx` (novo prop `size`, independente de `variant`), `src/components/cart-icon.tsx`
- decisões: acesso de leitura ao projeto Claude Design liberado nesta sessão via DesignSync após `/design-consent` (antes 404 — projeto não é `PROJECT_TYPE_DESIGN_SYSTEM`, mas `get_project`/`list_files`/`get_file` funcionam mesmo assim). Comparei a seção `id="2b"` (Home, desktop 1440 + mobile 390) da `Canvas Selo Libertaria.dc.html` linha a linha contra o código. Corrigido: faixa de categoria não mostra mais contagem por item (só em "Tudo", conforme `CategoryBar.prompt.md` do próprio design system); valor dos stats do Sarau 20px→24px; `SlButton` ganhou `size` independente de `variant` porque o canvas usa a MESMA altura em botões de variantes diferentes conforme o contexto (hero: "Ler trecho" secundário a 56px ao lado do "Comprar agora"; Sarau: "Garantir ingresso" a 48px, não 56px) — sem isso não dava pra bater as duas alturas com um só componente; ícone do carrinho no header virou quadrado 44×44 com SVG (sem texto "Carrinho" visível), como o canvas mostra e como `docs/design/userinterface.md` (atualização 2026-06-30) já pedia. `readme.md` do design system confirma que D4 (`00-decisoes-pendentes.md`) deveria resolver para as 6 categorias fixas do Canvas — não modelei isso aqui, só documentando a confirmação.
- dúvidas/bloqueios: Home mobile (390px) do canvas tem uma barra de compra fixa no rodapé do hero (produto + preço + CTA "Comprar" 52px) que não existe no código — não construí por ser elemento novo (posição fixa, z-index com menu mobile e carrinho); não consegui abrir issue no Linear para isso (workspace no limite do plano grátis). `ProductCard.jsx` do design system confirma que categoria como texto no corpo do card (não como badge sobre a imagem) é o padrão pretendido — o mock desktop do canvas usa badge só como ilustração pontual daquela tela; não mexi no `SlProductCard`.
