# Selo Libertária — 2026-09-06

- O modo de pré-venda deixou de ler `PRESALE_MODE`: a fonte de verdade é `current.preSale.enabled` nas settings do FastAPI, alterada pelo admin em `/admin/pre-venda`.
- O admin de pré-venda agora persiste `pageEnabled`, `popupEnabled`, `launchAt`, `windowStartAt` e `windowEndAt`; a landing e o modal global respeitam a janela e são independentes.
