# Selo Libertária — Documentação reorganizada

Este pacote contém versões limpas dos documentos enviados, reorganizadas a partir do contexto consolidado:

- projeto herdado de fork;
- storefront/admin já funcional;
- Selo Libertária como identidade final;
- Canvas Selo Libertaria (Claude Design) como referência visual;
- menu público oficial;
- rotas existentes preservadas;
- admin editorial já existente;
- prompts P0–P6 para Codex.

Arquivos principais:

- `AGENTS.md` — instruções limpas para Codex.
- `docs/product/spec.md` — spec de produto consolidada.
- `docs/product/site-overview.md` — estado real do site/app.
- `docs/product/TODO.md` — backlog P0–P6.
- `docs/design/UI_UX_PATTERNS.md` — padrões de UI/UX.
- `docs/design/userinterface.md` — resumo visual rápido.
- `docs/design/userexperience.md` — resumo de experiência.
- `docs/product/SELOLIBERTARIA_SITE_MAP.md` — mapa de navegação/conteúdo.
- `docs/patterns/AUTH_SOCIAL_BUTTON_PATTERN.md` — padrão OAuth.
- `CODEX_PROMPTS.md` — prompts separados por fase.

## Docker para desenvolvimento

Com a rede compartilhada criada, suba o frontend com autoreload e bind mount:

```bash
docker network create devbutter_shared 2>/dev/null || true
docker compose up -d --build frontend
```

O frontend fica em `http://localhost:3001`. Alterações nos arquivos locais são detectadas pelo
Next.js; `node_modules` e `.next` permanecem em volumes Docker.
