# 03 — Selo consumir o `asaas_payment`

**Repositórios alvo:** `selolibertaria/backend` e `selolibertaria-store`

## Escopo

Troque o cliente Asaas direto por cliente mTLS do contrato `01`. A Selo não cifra,
armazena ou recebe a `apiKey`.

## Entregáveis backend

1. Cliente tipado para customers, payments, status e refund do proxy.
2. Mapeamento fiel do erro normalizado para a API de checkout, preservando `request_id`.
3. Receptor autenticado/deduplicado do evento interno enviado pelo proxy e atualização
   idempotente de `Payment` e `Order`.
4. Remover dependências de runtime de `ASAAS_CLIENT_MODE`, `ASAAS_CREDENTIAL_ENCRYPTION_KEY`
   e chamada direta à Asaas somente quando o novo fluxo estiver verde.
5. Testes com fake do proxy: sucesso, timeout, recusa, duplicação, evento fora de ordem e
   garantia de que nenhum segredo é persistido.

## Entregáveis store

1. Adaptar o checkout ao contrato do backend, sem endereço/chave interna do proxy no browser.
2. Exibir instruções de pagamento e erros normalizados de maneira segura.
3. Manter Mercado Pago isolado até a chave de feature apontar para o novo provider; não
   alternar a produção nesta fatia.

## Restrições

- Não chamar a Asaas diretamente.
- Não criar fallback silencioso para Mercado Pago quando a seleção for Asaas.
- Não alterar segredos ou configuração de ambiente produtivo.
