# Issue: fonte de destaque sem cobertura de acentos PT-BR

> Não foi possível criar a issue diretamente no Linear (MCP sem autenticação nesta sessão).
> Descrição abaixo para registro manual quando o acesso estiver disponível.

## Título sugerido
fix: fonte de destaque (DCC Ash) sem glifos acentuados PT-BR

## Descrição

A fonte `DCC - Ash.otf`, usada como fonte de destaque do site (`--font-editorial-display`,
títulos, branding, ex: "Selo Libertária"), não possui glifos para os seguintes caracteres:

- à, ã, ê, õ, ç
- Ã, Ç, Õ

Isso fazia com que qualquer título usando essas letras caísse silenciosamente para o
fallback de sistema (`"Segoe UI", sans-serif`) na renderização desses caracteres
específicos, quebrando a identidade visual em palavras comuns em português como
"não", "coração", "ação", "Libertária" (em alguns pesos), etc. — sem gerar nenhum erro
de build ou warning visível.

Confirmado via inspeção do cmap da fonte com `fontTools`:

```python
from fontTools.ttLib import TTFont
f = TTFont('public/fonts/DCC - Ash.otf')
cmap = f.getBestCmap()
# à, ã, ê, õ, ç, Ã, Ç, Õ ausentes do cmap
```

## Resolução aplicada

PR [#50](https://github.com/acidbutter96/selolibertaria-store/pull/50) na branch
`feature/fix-display-font-accents`: troca de `DCC - Ash.otf` por **Rubik Distressed**
(Google Fonts, licença OFL), com cobertura completa de Latin Extended confirmada e
estética grunge/distressed equivalente.

## Follow-up recomendado

- Ao adicionar/trocar fontes locais no projeto, validar cobertura de glifos PT-BR
  (à, á, â, ã, é, ê, í, ó, ô, õ, ú, ç e maiúsculas) antes de mesclar — não há checagem
  automática disso hoje.
- Considerar um script/CI simples que rode `fontTools` sobre `public/fonts/*.otf|*.ttf`
  e falhe se algum glifo do alfabeto acentuado PT-BR estiver ausente.
