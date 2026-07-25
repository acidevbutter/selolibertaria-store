# DEV-151 — QA atual do checkout embutido

## Evidência confirmada

- O Browser acessou catálogo e PDP sem exibir uma conta de compra.
- A aplicação bloqueou corretamente checkout para a sessão ainda identificada como backoffice, sem criar cobrança.
- Console do Browser sem erros ou warnings.

## Limite da execução

- A ação de sair não removeu a sessão de backoffice de forma observável no Browser; por isso o checkout convidado, o Card Brick e o Pix não foram executados nesta validação.
- O MCP Mercado Pago está OAuth-enabled no CLI, mas suas ferramentas não foram carregadas nesta conversa. Não houve chamada direta ao provedor como substituição.

Os prints `dev-151-checkout-current.png` e `dev-151-guest-checkout.png` registram o bloqueio seguro.
