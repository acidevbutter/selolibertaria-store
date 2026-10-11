# 05 — Validação sandbox e decisão GO/NO-GO

**Tipo:** validação; não alterar código exceto correções explicitamente autorizadas.

## Cenários obrigatórios

1. CN não autorizado e subconta de outro dono: `403`/`404`, sem contato com Asaas.
2. Criar cliente e cobrança pelo backend Selo via proxy.
3. Repetir a mesma `request_id`: mesma resposta segura; payload divergente: `409`.
4. Simular erro de validação, recusa, timeout e indisponibilidade Asaas; validar contrato de erro.
5. Receber webhook duplicado e fora de ordem; confirmar um único efeito no pedido.
6. Inspecionar logs, auditoria, respostas e banco Selo: nenhuma `apiKey` presente.
7. Rotacionar credencial somente em sandbox e provar que a venda continua usando o proxy.

## Veredito

Produza uma tabela GO/NO-GO por cenário, com comando/evidência real. É NO-GO se houver
segredo fora do `asaas_payment`, endpoint genérico acessível à Selo, webhook sem dedupe,
ou teste de pagamento sem evidência sandbox. Produção exige autorização explícita posterior.
