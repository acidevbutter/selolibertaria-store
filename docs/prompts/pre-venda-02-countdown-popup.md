# Prompt 02 — Pop-up de contagem regressiva: exibição, capping e acessibilidade

## Contexto

`src/ui/pre-venda/pre-sale-countdown-popup.client.tsx` já implementa:

- abertura automática após `campaign.popup.autoOpenDelayMs` (default 1500 ms);
- "snooze" após o visitante fechar, gravando
  `presale:{slug}:popup-dismissed-until` em `localStorage`
  (`campaign.popup.snoozeHours`, default 24 h);
- fechamento por ✕, clique no backdrop, tecla `Esc` e link "Continuar navegando";
- `role="dialog"` + `aria-modal` + `aria-labelledby`, foco no botão fechar,
  retorno de foco ao fechar, trava de scroll do `body`;
- contagem regressiva de 1 s baseada em `resolveCountdownTarget(campaign)`,
  com estado `remaining.done` quando o alvo já passou.

## Objetivo

Transformar o pop-up de "abre sempre depois de 1,5 s" em uma peça de campanha
governável: regras claras de quando aparecer, sem irritar quem já viu, acessível,
e instrumentada para medir conversão.

## Requisitos funcionais

### 1. Fonte da verdade do countdown

- O alvo (`launchAt`) vem da campanha (prompt 03). Renderizar no servidor o
  `targetTs` (epoch ms) e passar como prop — hoje o cálculo roda no cliente e
  pode divergir do relógio do servidor.
- Se `launchAt` mudar no admin, o pop-up reflete no próximo carregamento (sem
  cache agressivo na rota — já é `force-dynamic`).
- `remaining.done`: trocar o corpo por "já está disponível" + CTA "Ver na loja"
  apontando para o produto; nunca mostrar `00 00 00 00` piscando.

### 2. Regras de exibição / capping

Tornar configuráveis em `campaign.popup` (estender o tipo):

```ts
trigger: "delay" | "scroll" | "exit-intent";   // default "delay"
scrollDepthPercent?: number;                    // p/ trigger "scroll", ex. 40
maxImpressionsPerVisitor?: number;              // default 3 (conta em localStorage)
snoozeHours: number;                            // já existe
frequency: "once-per-snooze" | "every-visit";  // default "once-per-snooze"
showOncePerSession?: boolean;                   // default true (sessionStorage)
```

- Contabilizar impressões em `presale:{slug}:popup-impressions` (`{ count, lastAt }`).
  Ao atingir `maxImpressionsPerVisitor`, não abrir mais até expirar o snooze.
- `exit-intent` (desktop): `mouseout` com `relatedTarget == null` e
  `clientY <= 0`. Em telas touch, cair para `delay`.
- Não abrir se a URL tiver `?nopopup=1` (QA) nem para bots (`navigator.webdriver`).
- Não abrir se o CTA de compra da campanha estiver indisponível (ex.: "lançado" e
  sem link de loja).

### 3. Acessibilidade (fechar as lacunas)

- **Focus trap real**: `Tab`/`Shift+Tab` circulam entre os focáveis do diálogo
  (hoje só há foco inicial). Considerar extrair para o `Dialog` do Radix
  (`@radix-ui/react-dialog` já é dependência) mantendo o visual da campanha —
  ganha trap, `aria`, dismiss e portal de graça.
- `aria-describedby` apontando para a linha do countdown; `aria-live="polite"`
  só nos segundos seria verboso — manter `off` e expor um resumo textual
  ("faltam X dias") em `sr-only` atualizado a cada minuto.
- `prefers-reduced-motion`: já respeitado via `motion-safe:`; garantir que
  nenhuma animação nova (entrada do card) ignore isso.
- Contraste AA do laranja `#F2891E` sobre `#0B0B0B` para textos pequenos —
  validar; se reprovar, usar `#F7F4EF` no texto e laranja só em blocos grandes.

### 4. Telemetria

- `presale_popup_open` `{ slug, trigger, impression: n }`
- `presale_popup_dismiss` `{ slug, via: "x" | "backdrop" | "esc" | "link", secondsOpen }`
- `presale_popup_cta_click` `{ slug }`
- Enviar via Umami (`data-umami-event`) e `track()` do `@vercel/analytics`.

### 5. Refatoração

- Mover a lógica de storage (impressões, snooze, sessão) para um hook testável
  `usePopupFrequency(key, opts)` em `src/ui/hooks/`.
- Deixar o componente burro: recebe `open`, `onDismiss`, `targetTs`, `labels`.

## Critérios de aceite

- [ ] Primeira visita: pop-up abre conforme `trigger`; ao fechar, `Esc`/reload
      dentro de `snoozeHours` **não** reabre.
- [ ] Após `maxImpressionsPerVisitor` aberturas, não reabre até o snooze expirar.
- [ ] `?nopopup=1` suprime o pop-up.
- [ ] Teclado: foco fica preso no diálogo; `Esc` fecha; foco volta ao gatilho.
- [ ] `launchAt` no passado → estado "disponível", sem dígitos zerados piscando.
- [ ] axe-core / Lighthouse a11y sem violações novas na rota.
- [ ] Eventos aparecem no Umami com os payloads acima.
- [ ] `yarn lint`, `yarn test`, `tsc --noEmit` limpos.

## Testes

- `usePopupFrequency`: incrementa impressões, respeita `maxImpressions`,
  `snoozeHours`, `showOncePerSession`; tolera `localStorage` lançando exceção
  (modo privado) — sem quebrar a UI.
- Componente: não renderiza com `open=false`; `Esc` chama `onDismiss("esc")`;
  clique no backdrop sim, clique no card não; CTA dispara `onCtaClick`.
- `computeRemaining`: limites (alvo agora, alvo no passado, > 99 dias).
