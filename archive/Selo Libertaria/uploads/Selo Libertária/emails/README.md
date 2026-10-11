# Emails Selo Libertária — butter_relay

Sintaxe: **Python `str.format`** — `{variavel}`. Os arquivos não contêm nenhuma chave
literal além dos placeholders (sem `<style>`, sem media query), então `template.format(**dados)`
nunca levanta `KeyError`/`IndexError` por chave espúria.

```python
html = open("emails/pedido-confirmado.html", encoding="utf-8").read()
rows = open("emails/_partial-item-row.html", encoding="utf-8").read()
items_html = "".join(rows.format(**i) for i in pedido.itens)
corpo = html.format(items_html=items_html, **dados)
```

`{items_html}` é o único slot de repetição: renderize `_partial-item-row.html` uma vez por item
e injete o resultado. Passe `str` já formatado (R$ com vírgula, datas curtas minúsculas).

## Templates

| Arquivo | Uso |
| --- | --- |
| `pedido-confirmado.html` | pedido recebido, pagamento em análise |
| `pagamento-aprovado.html` | Pix/cartão aprovado |
| `pedido-enviado.html` | despacho + rastreio |
| `pagamento-recusado.html` | recusa, carrinho salvo, retomada |
| `ingresso-confirmado.html` | sarau / laboratório |
| `newsletter-lancamento.html` | lançamento e pré-venda |
| `base-shell.html` | shell genérico, tudo variável |

## Variáveis

Globais (todos): `site_url`, `logo_url`, `header_tag`, `support_email`, `unsubscribe_url`, `preferences_url`.

- **pedido-confirmado**: `order_number`, `customer_first_name`, `customer_name`, `subtotal`, `shipping_label`, `shipping_price`, `coupon_code`, `discount`, `total`, `address_line`, `city`, `state`, `zip`, `delivery_estimate`, `order_url`, `items_html`
- **pagamento-aprovado**: `order_number`, `payment_method`, `paid_at`, `total`, `dispatch_estimate`, `order_url`, `items_html`
- **pedido-enviado**: `order_number`, `tracking_code`, `carrier`, `shipping_label`, `shipped_at`, `delivery_estimate`, `address_line`, `tracking_url`, `tracking_grace_days`, `items_html`
- **pagamento-recusado**: `order_number`, `payment_method`, `attempted_at`, `decline_reason`, `total`, `cart_hold_hours`, `cart_expires_at`, `retry_pix_url`, `retry_card_url`
- **ingresso-confirmado**: `event_name`, `event_date`, `event_venue`, `event_address`, `customer_name`, `ticket_type`, `ticket_quantity`, `ticket_code`, `doors_time`, `arrival_deadline`, `event_description`, `ticket_url`
- **newsletter-lancamento**: `release_title`, `release_teaser`, `release_image_url`, `release_author`, `release_format`, `release_run`, `release_price`, `presale_deadline`, `release_ship_date`, `release_body`, `release_url`, `items_html`
- **base-shell**: `email_title`, `preheader`, `eyebrow`, `headline`, `lead`, `body_html`, `row_N_label`, `row_N_value` (1–4), `cta_label`, `cta_url`, `cta_note`, `items_title`, `items_html`

Linhas opcionais (cupom, desconto) devem ser removidas pelo relay quando vazias — ou passe `—`.

## Regras de construção

- Tabelas `role="presentation"`, largura 600px, tudo inline, canto reto (zero `border-radius`).
- Fundo escuro: mesa `#141210`, cartão `#0B0B0B`, tinta `#F7F4EF`; CTA vermelho `#B3282E`
  (compra) e rótulos em vinho/vermelho apenas como acento. `color-scheme: dark light` declarado,
  então clientes em dark mode não reinvertem.
- Fonte: `'Iowan Old Style', Georgia, serif` — o fallback do Fertigo. Webfont não é usada:
  Gmail e Outlook a descartariam e a página cairia para uma sem-serifa errada.
- Espaçamento por spacer `<div>` (Outlook ignora `margin`), `<img>` com `width`/`height` e
  `display:block`, `alt` em todas.
- Sem `<style>`: além de quebrar o `.format`, Gmail remove parte e Outlook.com reescreve.
  Consequência aceita: nenhum breakpoint — o layout de 600px é fluido por `max-width`.
- `logo_url` e `release_image_url` precisam ser URLs públicas hospedadas (email não lê arquivo local).
  Suba a logo em papel `#F7F4EF` em PNG 300×48 para sobreviver ao fundo escuro.
- `emails/preview/` são cópias com dados de exemplo — não use no relay.
