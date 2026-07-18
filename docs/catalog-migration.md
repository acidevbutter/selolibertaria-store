# Migração do catálogo para MongoDB

O catálogo canônico está em `catalogProducts`. O script aceita um export JSON de produtos/preços e não chama nenhum provedor externo.

```bash
yarn migrate:catalog --input ./data/catalog-export.json --dry-run --export ./data/catalog-before.json
yarn migrate:catalog --input ./data/catalog-export.json --apply --export ./data/catalog-before.json
```

O modo padrão é `dry-run`; ele só conta produtos/variantes e lista inconsistências. O modo `--apply` é idempotente por `slug`, preserva ids do provedor em `legacyProviderIds` e não apaga documentos fora do export. Imagens hospedadas em domínio legado são reportadas e não entram no catálogo público.

Para rollback, use o snapshot gerado antes da virada:

```bash
yarn migrate:catalog --rollback ./data/catalog-before.json --apply
```

O rollback explícito restaura exatamente o snapshot: remove os documentos atuais de `catalogProducts` e reinsere as linhas exportadas. Execute-o somente com um snapshot completo e após interromper novas escritas no catálogo.

Faça backup do banco antes da janela de migração. Valide contagens, slugs, preços BRL, imagens, variantes, estoque e pedidos históricos antes de remover as credenciais antigas.
