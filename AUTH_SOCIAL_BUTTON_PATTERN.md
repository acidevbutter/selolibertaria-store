# Auth Social Button Pattern

## Objetivo

Manter os botões de OAuth no login com uma linguagem visual consistente, centralizada e atual, sem violar exigências de branding dos provedores.

Este arquivo é específico do cluster social de autenticação e complementa o documento geral [UI_UX_PATTERNS.md](./UI_UX_PATTERNS.md).

## Referências externas

- Google Identity branding guidelines:
  - https://developers.google.com/identity/branding-guidelines
- Atlassian form patterns:
  - https://design-system-docs-proxy.services.atlassian.com/patterns/forms/

## Princípios adotados

1. O login por email e senha continua como ação primária.
2. OAuth aparece como grupo secundário centralizado logo abaixo do botão principal.
3. Todos os provedores disponíveis devem ter o mesmo peso visual e o mesmo tamanho base.
4. O grupo social deve parecer parte do mesmo sistema, não uma coleção solta de botões de marcas.
5. O Google mantém superfície clara, logo colorido e texto explícito para respeitar as regras oficiais.

## Especificação visual

- Largura máxima do trilho de ações sociais: `22rem` (`352px`).
- Alinhamento do grupo: centralizado com `margin-inline: auto`.
- Espaçamento entre divisor e ações: `12px`.
- Espaçamento entre botões sociais: `10px`.
- Altura dos botões sociais: `44px`.
- Raio dos botões sociais: `12px`.
- Ícone: `18px` dentro de um suporte visual fixo.
- Texto: centralizado visualmente mesmo com ícone à esquerda.
- Superfície base: clara/neutra com borda discreta e sombra curta.
- Hover: leve elevação, borda um pouco mais evidente e fundo ligeiramente mais opaco.
- Focus: anel visível de alto contraste.

## Estrutura recomendada

- Divisor com linhas laterais e rótulo central curto, por exemplo `Or continue with`.
- Coluna única de ações sociais.
- Cada ação usa:
  - ícone à esquerda;
  - label central;
  - espaçador simétrico à direita para manter o texto visualmente centralizado.

## Estado atual implementado

- Implementado em `src/ui/auth/oauth-buttons.tsx`.
- O trilho social continua centralizado com `max-width: 22rem`.
- O divisor usa cápsula central com `Or continue with`.
- Cada botão usa grade interna `ícone | texto | espaçador` para manter o label visualmente centralizado.
- O Google mantém fundo branco e borda mais específica.
- Facebook e Instagram seguem o mesmo sistema visual base, variando sobretudo no ícone e no suporte cromático do badge do ícone.

## Regras por provedor

### Google

- Usar ícone oficial colorido.
- Não usar ícone isolado sem contorno e sem texto.
- Manter fundo branco ou quase branco, com contraste alto no texto.
- CTA permitido: `Continue with Google`.

### Facebook / Instagram

- Manter a mesma estrutura do sistema.
- Permitir variação apenas no ícone e em um leve tom do suporte visual do ícone.
- Evitar transformar cada botão em um bloco totalmente colorido da marca, para preservar consistência do formulário.

## Regras de implementação

- Usar SVGs de `public/images/icons/` quando existirem.
- Não quebrar a largura do grupo em múltiplas colunas no desktop; centralização e ritmo visual são prioritários.
- O botão principal de login deve compartilhar a mesma largura máxima do trilho social quando isso melhorar a coerência do card.
- Mudanças futuras no cluster social devem atualizar este arquivo, [UI_UX_PATTERNS.md](./UI_UX_PATTERNS.md), `AGENTS.md` e `spec.md`.
