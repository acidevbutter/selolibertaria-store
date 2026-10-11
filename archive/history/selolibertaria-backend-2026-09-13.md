# Selo Libertária Backend — 2026-09-13

- Em desenvolvimento, o emissor AWS EMF usa um sink nulo e não escreve JSON de métricas no stdout; staging, preprod e produção preservam o sink de stdout para extração pelo CloudWatch.
- O stdout do logger normal usa formato textual compacto em desenvolvimento; staging, preprod e produção preservam JSON estruturado.
