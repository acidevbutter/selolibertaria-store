---
slice: 07 (revisado — parcial, decisão primeiro)
titulo: Carrinho — resolver D3 antes de tocar em frete; visual já está pronto
modelo: raciocínio (dinheiro real, mudança de fluxo em jogo)
depende_de: ["00-decisoes-pendentes.md (D3)"]
arquivos_previstos:
  - src/components/cart-sidebar.tsx
  - possivelmente src/lib/checkout (client de frete existente, confirmar nome exato antes de mexer)
---

## O que já está feito (não refazer)

`src/components/cart-sidebar.tsx` já segue a composição do Canvas descrita em
`docs/design/userinterface.md` (atualização 2026-07-01): base papel, cupom com campo compacto +
feedback (aplicado/inválido, linhas ~230-254), resumo com subtotal/total, tokens `--editorial-*`
em toda a superfície. Não recriar essa base visual.

## Passo 0 — obrigatório antes de qualquer código

Ler **D3** em `00-decisoes-pendentes.md`. Este prompt só avança além deste ponto depois de D3 ter
uma resposta registrada. Se D3 ainda não tiver resposta, o único trabalho válido deste prompt é:
melhorar a redação do placeholder atual (linha ~272, hoje `"Frete"` → `"Calculado no checkout"`) —
trocar por um texto que deixe claro que é uma etapa futura, sem prometer um valor
(ex.: `"Calculado na próxima etapa"`), e parar aí.

## Escopo se D3 = (a) manter frete só no checkout

Nenhuma mudança de fluxo. Só o ajuste de copy do parágrafo anterior. Fechar o prompt aqui.

## Escopo se D3 = (b) implementar cotação no carrinho

1. Adicionar captura de CEP no drawer do carrinho (campo novo, usar `Field` de
   `01-fundacao-tokens-componentes.md` se já estiver pronto, senão `input.tsx` padrão).
2. Reaproveitar o client/lib de frete que o checkout já usa — **confirmar o nome exato do arquivo**
   antes de importar (procurar por "melhor envio"/"melhorEnvio"/"shipping" dentro de `src/lib/`
   e `src/actions/checkout-actions.ts`; não adivinhar o caminho).
3. Persistir a cotação obtida no mesmo lugar que o checkout já lê (`cart?.shippingRate`, já
   referenciado em `cart-sidebar.tsx:272`) para o checkout não recalcular do zero se o CEP não
   mudou.
4. Tratar estado "sem CEP ainda" (mensagem atual, sem quebrar o resumo) e estado de erro de CEP
   inválido/CEP fora de área de entrega.
5. Não remover a cotação do checkout — ela continua sendo a fonte de verdade final antes do
   pagamento; o carrinho é uma prévia.

## Critérios de aceite

- [ ] `yarn lint` e `yarn build` passam.
- [ ] Se D3=(a): só o texto do placeholder mudou, nenhuma chamada de rede nova no carrinho.
- [ ] Se D3=(b): CEP capturado no carrinho, cotação exibida, checkout continua funcionando (não
      duplicar cobrança de frete nem gerar dois valores divergentes entre carrinho e checkout).
- [ ] Nenhuma mudança em `X-Idempotency-Key` ou lógica de criação de pedido do Mercado Pago.
- [ ] Atualizar `prompts/PROGRESS.md` com a decisão D3 aplicada e o que foi tocado.

## O que não fazer

- Não implementar (b) sem D3 respondido — mesmo que pareça "só uma chamada de API a mais", é
  fluxo de compra com dinheiro real.
- Não reescrever a lógica de cupom nem de cálculo de subtotal/total já existentes.
- Não mudar a integração com Melhor Envio sem antes ler o código atual dela por completo (procurar
  o arquivo real, não assumir o nome).
