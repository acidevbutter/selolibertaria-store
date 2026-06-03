# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ratoeira77 Store is a Next.js 16 storefront and admin application integrated with Stripe for catalog and payment flows. It's built with React 19, TypeScript, and uses Yarn Classic with Node.js 24 as the default development stack.

## Development Commands

### Package Management & Installation
```bash
yarn install                   # Install dependencies
```

### Development Server
```bash
yarn dev                      # Start development server
```

### Building & Production
```bash
yarn build                    # Build for production
yarn start                    # Start production server
```

### Code Quality & Testing
```bash
yarn lint                     # Run Biome linter/formatter (auto-fix)
yarn test                     # Run Vitest tests
tsgo                         # TypeScript type checking (use tsgo command)
```

### Docker
```bash
yarn docker:build           # Build Docker image
yarn docker:run             # Run Docker container
```

## Architecture & Structure

### Core Technologies
- **Framework**: Next.js 16 with App Router
- **Runtime**: React 19 with React Compiler enabled
- **TypeScript**: Strict configuration with path aliases
- **Styling**: Tailwind CSS v4 with Radix UI components
- **State Management**: React Context for cart functionality
- **Payment Processing**: Stripe integration via commerce-kit
- **Testing**: Vitest with Testing Library
- **Linting**: Biome (replaces ESLint/Prettier)

### Directory Structure
```
src/
├── app/                     # Next.js App Router pages
│   ├── (store)/            # Store route group with layout
│   ├── api/                # API routes (auth, chat, webhooks)
│   └── login/              # Authentication pages
├── actions/                # Server actions
├── context/                # React Context providers (cart, modals)
├── i18n/                   # Internationalization (client/server)
├── lib/                    # Utilities, types, auth, search
├── ui/                     # Reusable UI components
│   ├── shadcn/             # Shadcn/ui components
│   ├── checkout/           # Checkout-specific components
│   ├── nav/                # Navigation components
│   └── products/           # Product-related components
└── store.config.ts         # Store configuration (categories, contact info)
```

### Key Architectural Patterns
- **Route Groups**: `(store)` group for main store pages with shared layout
- **Server Components**: Extensive use for performance optimization
- **Server Actions**: Form handling and data mutations
- **Dynamic Routes**: `[slug]` for products and categories
- **Catch-all Routes**: `[...segments]` for flexible routing
- **Parallel Routing**: Modal implementations using `@modal` slots

### Path Aliases
- `@/*` → `./src/*`
- `@ui/*` → `./src/ui/*`
- `@/components/ui/*` → `./src/ui/shadcn/*`

## Environment Configuration

### Required Environment Variables
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_CURRENCY` - Currency code (e.g., "usd")
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `NEXT_PUBLIC_URL` - Store URL (optional on Vercel)

### Optional Environment Variables
- `ENABLE_STRIPE_TAX` - Enable Stripe Tax calculations
- `STRIPE_WEBHOOK_SECRET` - For Stripe webhook handling
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` - Analytics tracking
- `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` - Newsletter signup endpoint
- `NEXT_PUBLIC_LANGUAGE` - Locale (defaults to "en-US")

## Code Style & Standards

### Biome Configuration
- **Indentation**: Tabs, width 2
- **Line Width**: 110 characters
- **Quotes**: Double quotes for JS/JSX
- **Trailing Commas**: Always
- **Semicolons**: Always required
- **Arrow Parentheses**: Always

### TypeScript Standards
- Strict mode enabled with additional strictness (`noUncheckedIndexedAccess`)
- No unused locals enforced
- Import type enforcement for type-only imports
- Path aliases configured for clean imports

## Testing

- **Framework**: Vitest with React Testing Library
- **Setup**: Global test setup in `src/setup-tests.ts`
- **Pattern**: `**/?(*.)test.?(c|m)[jt]s?(x)`
- **Mocking**: Automatic mock clearing/resetting between tests

## Commerce Integration

### Stripe Integration
- Products managed in Stripe Dashboard with metadata
- Required metadata: `slug` (for URLs)
- Optional metadata: `category`, `order`, `variant`
- Webhooks handle payment events and cache revalidation

### Search Functionality
- Simple search implementation for products
- Search functionality in `src/lib/search/`

## Key Development Notes

- Use server components by default, client components only when necessary
- Leverage Next.js 16 features; `next dev` already uses Turbopack by default
- Commerce Kit handles Stripe integration abstractions
- Internationalization ready with message files in `/messages`
- Docker-ready with standalone output mode
- Git hooks configured with Husky for commit linting
- don't use `yarn dev`; I have the server running in the background all the time, just ask about checking if needed
