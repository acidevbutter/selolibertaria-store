# Auth Social Button Pattern — Selo Libertária

## Objetivo

Manter os botões de OAuth no login com linguagem visual consistente, centralizada e subordinada ao login por email/senha.

Este documento é específico do cluster de autenticação social e complementa `UI_UX_PATTERNS.md`.

## Princípios

1. Login por email e senha continua como ação primária.
2. OAuth aparece como alternativa secundária logo abaixo do botão principal.
3. Todos os provedores disponíveis devem ter peso visual equivalente.
4. O grupo social deve parecer parte do sistema Editorial V2, não uma coleção solta de marcas.
5. Google mantém superfície clara, ícone oficial colorido e texto explícito para respeitar branding.

## Especificação visual

- Largura máxima do trilho: `22rem` / `352px`.
- Alinhamento: centralizado com `margin-inline: auto`.
- Espaçamento entre divisor e ações: `12px`.
- Espaçamento entre botões: `10px`.
- Altura: `44px`.
- Raio: `12px`, exceto se o login Editorial V2 exigir cantos mais retos no container principal.
- Ícone: `18px` dentro de suporte visual fixo.
- Texto: centralizado visualmente mesmo com ícone à esquerda.
- Hover: leve elevação e borda mais evidente.
- Focus: anel visível de alto contraste.

## Copy

Em `pt-BR`, usar:

- divisor: `ou continue com`
- Google: `Continuar com Google`
- Facebook: `Continuar com Facebook`
- Instagram: `Continuar com Instagram`
- Apple: `Continuar com Apple`

Em `en-US`, manter traduções via i18n, não hardcode solto.

## Regras por provedor

### Google

- Usar ícone oficial colorido.
- Não usar ícone isolado sem texto.
- Fundo branco/quase branco.
- Contraste alto no texto.

### Facebook / Instagram / Apple

- Mesma estrutura do sistema.
- Variação principal no ícone e no suporte cromático do ícone.
- Evitar transformar cada botão em um bloco totalmente colorido da marca.

## Implementação

- Usar SVGs de `public/images/icons/` quando existirem.
- Não quebrar em múltiplas colunas no desktop.
- O botão principal de login e o trilho social devem ter largura compatível.
- Não exibir `error` cru vindo de OAuth callback; mapear por código estável quando possível.
- Se alterar este padrão, atualizar também `UI_UX_PATTERNS.md`, `userinterface.md`, `userexperience.md`, `spec.md` e `AGENTS.md`.
