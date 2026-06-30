# Selo Libertária — Remaining Launch Plan

## Launch rule

**P0B is the launch gate.**

The project should not be considered ready to launch until:

1. **P0A — Cart/Product UX** is reviewed and committed.
2. **P0B — Checkout without pre-registration** is implemented and tested.

---

## Current status

### P0A — Cart and Product Actions

**Status:** implemented, pending final review/commit.

Done:

- Header cart is icon-only on desktop and mobile.
- Mobile floating cart appears only when cart has items.
- `/products` `Comprar` adds product to cart and redirects to checkout.
- `Adicionar ao carrinho` keeps the user on the page and updates the badge.
- `Favoritar` uses the existing favorite system.
- Cart badge persists across navigation.
- `yarn lint`, `yarn test`, and `yarn build` passed.

Before moving on:

- Review browser UI quickly.
- Check `messages/pt-BR.json` existing local diff.
- Commit P0A separately.

---

## P0B — Launch Gate: Checkout without pre-registration

**Status:** next required blocker.

Goal:

Let visitors buy without creating an account first and without confirming email before payment.

Required behavior:

- Visitor can start checkout while logged out.
- Checkout collects buyer data:
  - full name
  - email
  - CPF
  - phone
  - postal code
  - street
  - number
  - complement
  - neighborhood
  - city
  - state
- No email confirmation is required before payment.
- On successful purchase:
  - create user automatically if email does not exist;
  - reuse existing user if email already exists;
  - link order to the created/existing user;
  - mark email as usable/verified for this order context;
  - send completed purchase email;
  - include secure account access link.
- Magic link/token must:
  - be unique;
  - expire;
  - be linked to user and order;
  - not expose sensitive data in URL;
  - allow account access, order view, and password setup.

Logged-in users:

- If the user has a saved address, checkout should allow using it.
- The user can edit/use another address for this order.
- Multiple saved addresses are post-MVP.

UI copy:

Title:

> Dados para sua compra

Helper:

> Informe seus dados para concluir a compra. Sua conta será criada automaticamente e enviaremos o acesso por e-mail após a confirmação do pedido.

Final button:

> Finalizar compra

Avoid:

- “Confirme seu e-mail para continuar”
- “Crie uma conta antes de comprar”
- “Faça login para finalizar”

Email subject:

> Compra concluída — Selo Libertária

---

## After P0B

### P1 — Melhor Envio QA

Run only after P0B, because checkout will change.

Validate:

- real quote with CEP;
- shipping total in checkout;
- PaymentIntent amount includes shipping;
- final order stores shipping snapshot;
- admin order detail shows shipping data.

### P2 — Final checkout regression

Validate:

- logged-in purchase;
- logged-out purchase with new email;
- logged-out purchase with existing email;
- magic link login;
- password setup;
- order visible in account;
- mobile flow;
- transactional emails;
- admin order detail.

### P3 — Post-MVP

Keep for later:

- multiple saved addresses;
- default address selector;
- Melhor Envio OAuth refresh;
- shipping service selector;
- label purchase;
- tracking.

---

## Short launch checklist

- [ ] P0A reviewed and committed
- [ ] P0B implemented
- [ ] Guest checkout works
- [ ] Email confirmation is not required before payment
- [ ] User is created/reused after successful purchase
- [ ] Order is linked to user
- [ ] Completed purchase email is sent
- [ ] Magic link works
- [ ] Logged-in saved address works
- [ ] Mobile checkout works
- [ ] P1 shipping QA passed
- [ ] P2 final regression passed
