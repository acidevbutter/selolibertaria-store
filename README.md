# Selo Libert&aacute;ria

Aplicação híbrida em Next.js 16 que combina storefront, catálogo Stripe, checkout, área administrativa e camadas editoriais do Selo Libertária.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Stripe
- MongoDB
- Vitest

## Comandos

```bash
yarn install
yarn dev
yarn build
yarn start
yarn lint
yarn test
yarn seed:admin
```

## Ambiente

Vari&aacute;veis principais:

- `NEXT_PUBLIC_LANGUAGE`
- `STRIPE_SECRET_KEY`
- `STRIPE_CURRENCY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_URL`
- `MONGODB_URI`
- `MONGODB_DB_NAME`

## Observa&ccedil;&otilde;es

- O servidor de desenvolvimento roda em `http://localhost:3001` com `next dev --webpack -p 3001`.
- O build de produ&ccedil;&atilde;o passa por `scripts/vercel-build.mjs`.
- O bootstrap do admin pode ser feito com `yarn seed:admin`.
- O seed editorial pode ser feito com `yarn seed:editorial`.
- O seed do admin espera `MONGODB_URI`, `MONGODB_DB_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`; a senha precisa ter pelo menos `6` caracteres.
- O projeto preserva fluxos de catálogo, carrinho, checkout, pedidos, promoções, editorial, webhooks e logs de e-mail no mesmo repositório.
