# 2026-08-30 — Compose do backend

- Corrigido o mapeamento padrão da API para a porta host 8001, evitando o
  conflito com `asaas_payment` em 8000. A porta pode ser sobrescrita por
  `BACKEND_HOST_PORT`.
- API recriada na rede `devbutter_shared`; migrations aplicadas e
  `GET /health` respondeu 200 em `http://localhost:8001/health`.
