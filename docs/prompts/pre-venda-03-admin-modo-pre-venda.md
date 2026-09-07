# Prompt 03 — Admin: ativar/desativar o "modo pré-venda"

> Nota de implementação: `PRESALE_MODE` foi removida da decisão em 2026-09-06.
> O toggle persistido no admin é a fonte de verdade. As referências a override por
> ambiente abaixo pertencem à proposta original e não devem ser reaplicadas.

> Estado implementado (2026-09-06): `current.preSale` agora mantém `pageEnabled`,
> `popupEnabled`, `launchAt`, `windowStartAt` e `windowEndAt`. A landing e o modal
> global são controles independentes e só ficam ativos dentro da janela. O conteúdo
> da campanha continua estático nesta fase; e-mail, templates e Butter Relay ficam
> fora deste slice.

## Contexto

Hoje o modo pré-venda é ligado só por variável de ambiente:
`src/lib/pre-sale.ts` → `isPreSaleModeEnabled()` lê `process.env.PRESALE_MODE`
(espelhando `src/lib/maintenance-mode.ts`). A rota
`src/app/(store)/pre-venda/little-fish-big-fish/page.tsx` faz `notFound()` quando
está desligado. Não há UI de administração nem agendamento.

O admin já tem o padrão a seguir:

- guarda de rota: `auth()` + `session.user.role !== "admin"` → `redirect("/forbidden")`;
- capabilities em `src/lib/authz.ts` + `requireCapability` em server actions
  (`src/lib/api-auth.ts`);
- settings públicas lidas de FastAPI via `src/lib/settings-store.ts`
  (`GET /settings/public`, `cache: "no-store"`, timeout 1.8 s, fallback a default);
- navegação em `src/app/admin/_components/nav-config.ts`;
- primitivos visuais em `src/ui/editorial/editorial-primitives.tsx`
  (`AdminEditorialPage`, `AdminEditorialHero`, `EditorialPanel`, ...);
- server actions `"use server"` + `revalidatePath` (ver
  `src/app/admin/promotions/actions.ts`);
- gate de borda no `src/proxy.ts` (é lá que o `MAINTENANCE_MODE` intercepta).

## Objetivo

Dar ao time editorial um controle no `/admin` para **ligar e desligar o modo
pré-venda**, agendar a janela em que ele fica no ar, e editar o conteúdo da
campanha — com a env `PRESALE_MODE` permanecendo como override de emergência e
com histórico de quem mudou o quê.

## Requisitos funcionais

### 1. Modelo de estado

Persistir no mesmo backend das settings (FastAPI). Sugestão de documento
`preSale` dentro de settings ou coleção própria:

```ts
type PreSaleMode = {
  enabled: boolean;                 // toggle mestre (editorial)
  schedule?: {                      // opcional; quando presente, "enabled" só vale dentro da janela
    startAt?: string;               // ISO 8601
    endAt?: string;                 // ISO 8601
  };
  activeCampaignSlug: string;       // qual campanha a rota serve (default "little-fish-big-fish")
  campaigns: PreSaleCampaign[];     // conteúdo editável (contrato de src/lib/pre-sale.ts)
  updatedBy?: string;
  updatedAt?: string;
  history: Array<{ at: string; userId: string; changes: Record<string, unknown> }>;
};
```

Regra de resolução (implementar em `src/lib/pre-sale.ts`, server-only):

```
modoAtivo =
  process.env.PRESALE_MODE === "true"                       // override de emergência (liga)
  OR (
    settings.preSale.enabled
    AND (sem schedule OR agora ∈ [startAt, endAt])
  )
process.env.PRESALE_MODE === "false"  →  força desligado, ignora o resto
```

- `getPreSaleCampaign(slug)` passa a: resolver `modoAtivo`; buscar
  `settings.preSale.campaigns` (com fallback a `LFBF_CAMPAIGN` se a API cair);
  devolver a campanha de `slug` ou `null`.
- Cachear com `react.cache` + timeout curto, igual `getSettingsDoc`. Nunca
  derrubar a home se a API de settings estiver fora.

### 2. Tela de admin

Rota nova `src/app/admin/pre-venda/page.tsx` (Server Component, `force-dynamic`),
com guarda `role === "admin"` e nova capability `presale.write` (+ `presale.read`)
em `src/lib/authz.ts` e no mapa de roles.

Adicionar item em `nav-config.ts`:
`{ href: "/admin/pre-venda", label: "Pré-venda", icon: Fish /* lucide */, capability: "presale.read" }`.

Blocos da página (usar `EditorialPanel` + `<details>` como em
`/admin/settings`):

1. **Status** — `AdminEditorialStat`: "Modo pré-venda" = `Ativo`/`Inativo`
   (com o motivo: env override / agendado / manual / fora da janela), campanha
   ativa, e link "ver a página" (`/pre-venda/{slug}`, abre em nova aba).
2. **Ativação** — client component `admin-pre-sale-toggle.client.tsx`:
   - `Switch` (Radix / shadcn) para `enabled`;
   - dois inputs `datetime-local` para `schedule.startAt` / `endAt` (opcionais;
     validar `start < end`);
   - selo indicando se a env `PRESALE_MODE` está forçando algum estado
     (quando forçado, desabilitar o switch e explicar);
   - salvar via server action `setPreSaleMode(formData)` com
     `requireCapability("presale.write")`, gravar `history`, `revalidatePath("/",
     "layout")` + `revalidatePath("/pre-venda/[slug]")` + `revalidatePath(
     "/admin/pre-venda")`.
3. **Campanha ativa** — seletor `activeCampaignSlug` + formulário de edição dos
   campos de `PreSaleCampaign` (textos, `price`, `launchAt` com `datetime-local`,
   `countdownDays`, `productSlug`, `mercadoPagoPreferenceUrl`, imagens via
   `media-upload` já existente). Reaproveitar o padrão de
   `editorial-*-form.tsx`. `launchAt` é a fonte da verdade do countdown do
   prompt 02.
4. **Pré-visualização** — link/iframe para `/pre-venda/{slug}?preview=1` que
   ignora `notFound()` quando o usuário é admin (ver item 4 abaixo).
5. **Histórico** — tabela das últimas ~20 entradas de `history` (data, usuário,
   diff resumido), padrão de `SettingsHistoryEntry`.

### 3. Gate de rota e visibilidade

- `page.tsx` da pré-venda: manter `notFound()` quando `getPreSaleCampaign` é
  `null`, **exceto** se `?preview=1` e `session.user.role === "admin"` (renderiza
  com uma faixa "Pré-visualização — modo pré-venda está inativo").
- `src/proxy.ts`: **não** redirecionar o site inteiro (diferente de manutenção).
  Apenas garantir que `/pre-venda/*` não seja bloqueado por outras regras.
  Opcional: quando o modo está inativo, responder 404 já no proxy para
  `/pre-venda/*` (evita custo de render), respeitando o bypass de preview do
  admin.
- `src/app/sitemap.ts` e `robots`: incluir `/pre-venda/{activeCampaignSlug}`
  somente quando o modo está ativo e dentro da janela pública.
- Home / nav: quando o modo está ativo, expor um ponto de entrada (banner
  `PreSaleHeroBanner` ou card `PreSaleHighlightCard`, já exportados de
  `src/ui/pre-venda/pre-sale-landing.tsx`) — controlado por uma flag
  `showOnHome` no `PreSaleMode`.

### 4. Override por ambiente

- `PRESALE_MODE=true` → força ligado (campanha default), ignora toggle/schedule.
- `PRESALE_MODE=false` → força desligado (kill switch), ignora toggle/schedule.
- `PRESALE_MODE` ausente/qualquer outro valor → estado vem do admin.
- A tela de admin deve **mostrar** qual override está ativo e desabilitar os
  controles afetados, com texto explicando como remover (variável na Vercel).
- Documentar em `.env.example` e no `README` de deploy.

### 5. Auditoria e segurança

- Toda mutação passa por `requireCapability("presale.write")` e grava
  `history` com `userId` e `changes`.
- `activeCampaignSlug` precisa existir em `campaigns` — validar com `zod` antes
  de salvar (schema derivado de `PreSaleCampaign`).
- Sanitizar `mercadoPagoPreferenceUrl` (somente https, host `*.mercadopago.com*`
  / `mercadolibre`); `buyHref` interno deve começar com `/`.
- Sem segredos no documento público de settings — `GET /settings/public` não
  pode vazar nada além do necessário para renderizar a página.

## Contrato de API (FastAPI — a alinhar com o backend)

- `GET /pre-sale` → `PreSaleMode` público (sem `history`, sem campos internos).
- `GET /admin/pre-sale` → `PreSaleMode` completo (auth admin).
- `PUT /admin/pre-sale` → aplica patch parcial, retorna o documento + registra
  `history`. Campos: `enabled`, `schedule`, `activeCampaignSlug`, `showOnHome`,
  `campaigns[]`.

## Critérios de aceite

- [ ] Admin liga o toggle → `/pre-venda/little-fish-big-fish` passa a responder
      200 em no máximo um `revalidate` depois; desliga → volta a 404.
- [ ] Com `schedule` no futuro e `enabled=true`, a rota é 404 até `startAt` e
      404 de novo após `endAt`.
- [ ] `PRESALE_MODE=false` na env → toggle do admin fica desabilitado e a rota
      é sempre 404; `PRESALE_MODE=true` → sempre 200 com a campanha default.
- [ ] `?preview=1` como admin mostra a página mesmo com o modo inativo, com a
      faixa de pré-visualização; como visitante anônimo, continua 404.
- [ ] Editar `launchAt` / `price` / textos no admin reflete na landing e no
      pop-up sem novo deploy.
- [ ] Usuário sem `presale.write` recebe erro da server action e não vê o item
      no menu.
- [ ] `history` registra cada alteração com usuário e diff.
- [ ] Home mostra/oculta o ponto de entrada conforme `showOnHome`.
- [ ] `yarn lint`, `yarn test`, `tsc --noEmit` limpos.

## Testes

- `src/lib/pre-sale.test.ts`: matriz de resolução de `modoAtivo`
  (env `true` / `false` / ausente) × (`enabled` t/f) × (schedule: sem / dentro /
  antes / depois). `getPreSaleCampaign` com API fora (usa fallback).
- Server action `setPreSaleMode`: exige capability; valida `start < end`;
  rejeita `activeCampaignSlug` inexistente; grava `history`.
- Proxy: `/pre-venda/x` não é redirecionado para `/maintenance`; 404 opcional no
  proxy respeita o bypass de preview.
- Componente do toggle: desabilita quando há override de env; envia patch certo.
