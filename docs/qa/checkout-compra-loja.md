# Runbook QA — Fluxo feliz: Compra na loja (catálogo → produto → carrinho → checkout → pagamento)

- Data do teste: 2026-09-08
- Ambiente: local (`yarn dev` :3001, backend FastAPI :9001, Postgres via docker)
- Método: navegação real via browser (Chromium headless), rede e logs do backend inspecionados

## Passo a passo testado

1. Home (`/`) → carrega ok, mostra 1 livro em destaque ("Cartografia do Desejo").
2. `/products` → lista o catálogo (1 item no ambiente atual).
3. `/product/cartografia-do-desejo` → PDP carrega ok.
4. "Adicionar ao carrinho" → funciona, abre o drawer do carrinho com o item.
5. Aplicar cupom no carrinho → **ver bug #1**.
6. Checkout (`/checkout?prepared=1`) → formulário de identificação/entrega/pagamento em uma página só (3 etapas visuais, 1 form).
7. Preencher nome, e-mail, CPF, telefone, CEP → **ver bug #2** (autofill de endereço quebrado).
8. Preencher endereço manualmente + "Calcular total" com "Usar um novo endereço" → **ver bug #3** (frete não cotado).
9. Trocar entrega para "Retirar na loja" + "Calcular total" → funciona, frete R$ 0.
10. "Confirmar e pagar" → **ver bug #4** (pagamento indisponível, 503).

Resultado: **o fluxo feliz completo (comprar → pagar → confirmação) não foi possível concluir de ponta a ponta neste ambiente** — trava no passo de criação da cobrança Asaas. Com "Retirar na loja" dá para chegar até a tela de pagamento, mas não além.

## Bugs e causas-raiz encontrados

### Bug #1 — Cupom inválido é "aplicado" sem validação e sem erro visível no carrinho — ✅ CORRIGIDO (2026-09-08)
- **Onde**: drawer do carrinho (`Cupom` + botão `Aplicar`).
- **Repro**: digitar qualquer código inexistente (ex.: `SARAU10`, que é só o placeholder) e clicar Aplicar.
- **Observado**: UI mostra "Cupom SARAU10" com botão "Remover", como se tivesse sido aceito. `GET /api/cart` confirma: `"couponCode":"SARAU10","discountTotal":0,"appliedPromotions":[]` — o código foi salvo no carrinho mas nenhuma promoção correspondeu, e nada avisa o usuário.
- **Consequência**: ao seguir para o checkout com esse cupom "fantasma" no carrinho, o checkout inteiro falha (ver Bug #1b).
- **Sugestão de correção**: o endpoint de aplicar cupom deveria validar server-side e devolver erro imediatamente se o código não corresponder a nenhuma promoção ativa (hoje aceita qualquer string sem checar).
- **Correção aplicada**: `backend/app/carts/service.py` (`CartService.set_coupon`) agora chama `PromotionService.resolve_coupon(...)` antes de salvar o cupom no carrinho; se não houver promoção ativa correspondente, lança `ConflictError` (`409`, mensagem em PT-BR: "Cupom não encontrado ou não está mais válido."). Escolhido `ConflictError` (não `NotFoundError`/404) porque o helper `api()` do Next.js (`src/actions/cart-actions.ts:51`) trata qualquer 404 como "recurso ausente" e engole em `null`, o que esconderia o erro do usuário. `CartService` passou a receber `PromotionService` via injeção (`backend/app/carts/router.py`, `get_cart_service`). Testado: aplicar `SARAU10` agora mostra "Cupom não encontrado ou não está mais válido." direto no drawer do carrinho, sem marcar o cupom como aplicado.

### Bug #1b — Cupom inválido carregado no carrinho quebra o checkout com erro em inglês, sem rota de recuperação — resolvido indiretamente pelo Bug #1
- **Onde**: `/checkout?prepared=1` ao carregar com um cupom inválido persistido no carrinho.
- **Observado**: página inteira vira uma tela de erro: "ERRO NO CHECKOUT — Coupon code not found or no longer valid." — mensagem em **inglês** (site é 100% PT-BR), e o único link é "Continuar comprando" (volta para `/products`). Não há botão para remover o cupom ali mesmo e tentar de novo.
- **Consequência**: usuário fica preso sem entender o que houve, precisa voltar ao carrinho manualmente, achar o cupom escondido no drawer e clicar "Remover".
- **Sugestão de correção**: (a) traduzir a mensagem para PT-BR; (b) no checkout, oferecer ação direta "remover cupom e continuar" em vez de só voltar para a loja; (c) principal: resolver o Bug #1 na origem evita isso.
- **Status**: com o Bug #1 corrigido na origem, um cupom inválido nunca mais chega a ficar salvo no carrinho — então este cenário deixa de ocorrer na prática. Não criamos a UI de "remover cupom e continuar" no checkout porque não é mais alcançável; se no futuro surgir um jeito de o carrinho carregar um cupom que se tornou inválido depois (ex.: promoção expirou entre o "aplicar" e o "finalizar"), vale revisitar os itens (a) e (b) acima.

### Bug #2 — Autofill de CEP sempre mostra "consulta indisponível", mesmo quando a busca funciona — ✅ CORRIGIDO (2026-09-08)
- **Onde**: campo CEP no checkout (e reusado em outros formulários de endereço — `src/ui/auth/address-fields.client.tsx`, usado também em registro/perfil/admin).
- **Repro**: digitar um CEP válido (ex. `01311-000`) e sair do campo (blur).
- **Observado**: mensagem "A consulta de CEP está indisponível. Você pode continuar manualmente." aparece sempre, mas a chamada de rede `GET /api/address/postal-lookup?...` retorna **200 OK** com o endereço correto (`{"line1":"Avenida Paulista","district":"Bela Vista","city":"São Paulo","state":"SP",...}`). Os campos Logradouro/Bairro/Cidade/Estado nunca são preenchidos automaticamente.
- **Causa raiz confirmada no código**: incompatibilidade de contrato entre a rota da API e o cliente:
  - [route.ts:8](../../src/app/api/address/postal-lookup/route.ts) apenas repassa o corpo cru do backend (`return new Response(await response.text(), ...)`), ou seja, o JSON de resposta vem **achatado** (`{line1, district, city, ...}` na raiz).
  - [address-fields.client.tsx:328-331](../../src/ui/auth/address-fields.client.tsx) espera `{ result: {...} }`: `if (res.ok && data.result) { return { status: "success", result: data.result } }`. Como `data.result` é `undefined`, cai sempre no ramo "unavailable", apesar de `res.ok` ser `true`.
- **Impacto**: todo formulário de endereço no site (checkout, registro, perfil do usuário, admin) que reusa `address-fields.client.tsx` sofre do mesmo problema — usuário sempre precisa digitar rua/bairro/cidade/estado manualmente.
- **Correção sugerida**: alinhar os dois lados — ou a rota `route.ts` passa a responder `{ result: <corpo> }`, ou o cliente lê o objeto direto da raiz (`data.line1` etc.) em vez de `data.result`. É uma correção pequena e localizada.
- **Correção aplicada**: ajustado `lookupPostalCodeFromApi` em [address-fields.client.tsx](../../src/ui/auth/address-fields.client.tsx) para ler o corpo da resposta diretamente (`data.postalCode` como sinal de sucesso) em vez de `data.result`, já que `PostalLookupResult` já tinha o shape certo (`line1`, `district`, `city`, `state`, `postalCode`, `country`) — só a checagem estava errada. Testado no checkout: digitar `01311-000` agora preenche automaticamente Logradouro ("Avenida Paulista"), Bairro ("Bela Vista"), Cidade ("São Paulo") e Estado ("SP").

### Bug #3 — Frete por endereço ("Usar um novo endereço") sempre falha neste ambiente — config ausente, não bug de código
- **Onde**: `/checkout`, etapa de entrega, ao clicar "Calcular total" com endereço novo preenchido (mesmo endereço válido e completo).
- **Observado**: erro "Não foi possível cotar o frete para este endereço." sempre, para qualquer CEP.
- **Causa raiz confirmada**: [backend/app/shipping/service.py:33-37](../../../backend/app/shipping/service.py) — o serviço exige `settings.melhor_envio_access_token` e `settings.melhor_envio_origin_postal_code` configurados; se qualquer um estiver vazio, devolve esse erro genérico sem tentar a chamada à Melhor Envio. Nenhum dos dois está configurado neste ambiente local.
- **Consequência para o teste**: não dá pra validar o fluxo feliz "entrega no endereço" ponta a ponta localmente. Só "Retirar na loja" funciona (ver passo 9 acima), pois usa uma cotação fixa de R$ 0 sem chamar a Melhor Envio.
- **Ação**: não é bug de produto — é configuração de ambiente ausente (token + CEP de origem da Melhor Envio, provavelmente em Admin → Configurações de frete). Precisa ser configurado para testar o caminho de entrega por endereço.

### Bug #4 — Pagamento (Asaas) indisponível — conta Asaas não configurada neste ambiente
- **Onde**: `/checkout`, botão final "Confirmar e pagar".
- **Observado**: "Pagamento temporariamente indisponível. Tente novamente mais tarde." Log do backend: `ERROR [app.asaas.client] asaas_account_id_not_configured` seguido de `POST /checkout/intents -> 503`.
- **Causa raiz**: conta/credencial Asaas não configurada no backend local — consistente com o contexto já conhecido do projeto (relay de credenciais Asaas, ADR-0003, DEV-248 pendente).
- **Ação**: não é bug de produto para este teste — é bloqueio de configuração/credencial. **Sem isso, é impossível validar o fluxo feliz de pagamento (Pix/cartão/boleto) ponta a ponta neste ambiente.** Precisa da conta Asaas (sandbox) configurada para destravar o restante do teste de checkout (geração de cobrança, redirecionamento hospedado, retorno `/checkout/return`, confirmação do pedido).

## Não testado ainda (depende dos bloqueios acima ou de tempo)
- Conclusão real do pagamento (Pix/boleto/cartão) e tela de confirmação do pedido.
- `/checkout/return` e `/checkout/processing`.
- Fluxo de entrega por endereço com Melhor Envio configurado.
- Frete grátis acima de R$ 200 (mensagem "Faltam R$ 135,10 para o frete grátis" aparece no carrinho — não verificado se o cálculo bate).

## Resumo para priorização
| # | Bug | Severidade | Bloqueia o fluxo feliz? | Status |
|---|-----|------------|--------------------------|--------|
| 1/1b | Cupom inválido aceito sem validação + checkout quebra em inglês sem recuperação | Alta (UX) | Sim, se o carrinho tiver cupom inválido | ✅ Corrigido |
| 2 | Autofill de CEP sempre "indisponível" (bug de contrato de API) | Média (UX, mas não bloqueia — dá pra digitar manual) | Não bloqueia, mas piora a experiência em todo formulário de endereço do site | ✅ Corrigido |
| 3 | Frete por endereço sempre falha (config ausente) | Bloqueador neste ambiente | Sim, para entrega por endereço | ⚠️ Config pendente (não é bug de código — precisa de token + CEP de origem da Melhor Envio) |
| 4 | Pagamento Asaas indisponível (config ausente) | Bloqueador neste ambiente | Sim, para qualquer compra | ⚠️ Config pendente (não é bug de código — precisa da conta Asaas configurada no backend) |
