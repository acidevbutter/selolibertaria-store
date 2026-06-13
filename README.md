# Storefront Starter

Base de loja em Next.js 16 com cat&aacute;logo integrado ao Stripe, autentica&ccedil;&atilde;o, &aacute;rea administrativa e suporte a imagens gerenciadas.

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
yarn build
yarn start
yarn lint
yarn test
yarn seed:admin
```

## Ambiente

Vari&aacute;veis principais:

- `STRIPE_SECRET_KEY`
- `STRIPE_CURRENCY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_URL`
- `MONGODB_URI`
- `MONGODB_DB_NAME`

## Observa&ccedil;&otilde;es

- O servidor de desenvolvimento costuma ser mantido rodando em segundo plano no ambiente local deste projeto.
- O build de produ&ccedil;&atilde;o passa por `scripts/vercel-build.mjs`.
- O bootstrap do admin pode ser feito com `yarn seed:admin`.
- O seed do admin espera `MONGODB_URI`, `MONGODB_DB_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`; a senha precisa ter pelo menos `6` caracteres.
