# 06 — Validação e segurança ponta a ponta

**Repositórios alvo:** `devbutter_app/devbutter_backend` e `selolibertaria/backend`
**Modelo recomendado:** raciocínio alto (revisão, não implementação)
**Pré-requisito:** `03`, `04`, `05` implementados e com testes passando.

Segue a disciplina de `devbutter_app/docs/prompts/payment-tokenization/06-validation-review.md`: vereditos explícitos e conservadores. **NO-GO é um resultado válido e esperado na primeira rodada.** Não declarar sucesso sem verificar cada item abaixo contra o código real (não contra a intenção documentada).

## Checklist de revisão

1. **Segredo em trânsito**: a `api_key` da subconta nunca trafega sem TLS; a assinatura HMAC da rota de relay/rotação usa timestamp+nonce e rejeita replay (janela de tolerância curta, ex. 5 min); o header de assinatura é validado com `hmac.compare_digest` nos dois lados (`03` e `05`).
2. **Segredo em repouso**: `api_key` cifrada (Fernet ou equivalente) tanto em `asaas_payment.access_tokens` quanto em `selolibertaria.asaas_subaccount_credential`; chaves de cifragem dos dois sistemas são independentes; nenhuma migração, seed, fixture de teste ou log contém a chave em claro.
3. **Idempotência**: reenvio do mesmo `event_id` no relay inicial, na rotação e no webhook de pagamento não duplica efeito nem sobrescreve um `key_version` mais novo com um mais antigo (checar ordenação/corrida entre rotação proativa e reativa disparadas quase ao mesmo tempo).
4. **Falha de rotação não é silenciosa**: se o Selolibertaria não confirmar (`200`) uma atualização de chave em N tentativas, existe alerta observável (log estruturado no mínimo; métrica/painel se a infra permitir) e a credencial fica marcada `pending_rotation` de forma consultável.
5. **Checkout não quebra silenciosamente**: quando a credencial está `pending_rotation`, o endpoint de checkout responde erro explícito (não 500 genérico) e tenta acionar rotação reativa se ainda não foi acionada.
6. **Limite de escopo do que a Asaas garante**: confirmar que nenhuma parte do código assume que existe um webhook nativo da Asaas para "chave expirada/inválida" (não existe — ver `00-levantamento-tecnico.md` item B4). Toda a lógica de expiração/invalidação é responsabilidade da aplicação.
7. **Compliance de subconta**: fluxo de cadastro impede (ou trata explicitamente) tentativa de abrir subconta para CPF — Asaas bloqueia isso na API (item D.2 do levantamento).
8. **Autorização cruzada**: `devbutter_backend` só aceita `rotate-key` do Selolibertaria para subcontas que ele mesmo provisionou (equivalente ao padrão `_require_ownership` já usado em `asaas_payment/app/subaccounts/service.py`); Selolibertaria só aceita relay/`key-updated` assinado pela identidade esperada do `devbutter_backend`.
9. **Ambiente**: nenhum teste automatizado ou execução destas fatias tocou a API de produção da Asaas nem gerou/rotacionou uma chave real de subconta sem aprovação explícita registrada.

## Formato do veredito

Para cada item, registrar `OK`, `PLAUSÍVEL` (não verificado contra o código real, só contra a intenção) ou `BLOQUEADOR`, com o arquivo/linha citado como evidência. Veredito final da rodada: `GO` só se todos os itens forem `OK`; caso contrário `NO-GO` com a lista de bloqueadores nomeados — igual à disciplina já registrada em `payment-tokenization/06-validation-review.md`.

---

## Log de execução

_(anexar aqui cada rodada de validação, com Data, Chat, Modelo, veredito GO/NO-GO e lista de bloqueadores, se houver.)_
