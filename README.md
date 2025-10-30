# IslandiaAI Next.js Frontend

## Overview
This package contains the Next.js interface for IslandiaAI. It consumes the Rails GraphQL API via generated TypeScript hooks so we can reach feature parity with the existing dashboard experience.

## Prerequisites
- Node.js 20.19.4 (installable via `asdf install nodejs 20.19.4`)
- Yarn 1.22.22
- Access to an IslandiaAI backend environment that exposes the GraphQL endpoint.

## Quick start
1. Clone this repository and run `yarn install`.
2. Provision Playwright prerequisites (required before any E2E runs):
   - `yarn playwright install-deps` – installs system libraries needed inside fresh containers.
   - `yarn playwright install` – downloads the bundled browsers Playwright uses.
3. Copy `.env.example` to `.env.local`, then set:
   - `NEXT_PUBLIC_GRAPHQL_URL` – the browser-visible GraphQL endpoint. Defaults to `/api/graphql` so the app uses the built-in proxy.
   - `GRAPHQL_SERVER_URL` – the server-to-server GraphQL endpoint forwarded by the proxy (e.g., `http://localhost:3000/graphql`).
   - `GRAPHQL_SCHEMA_PATH=graphql/schema.graphql` – location of the shared SDL snapshot for code generation.
   - `NEXTAUTH_SECRET` – secret used to sign NextAuth JWT/session cookies (generate a random string in production). Must remain consistent across sessions to avoid decryption errors.
   - `NEXTAUTH_URL` – (optional in development) the canonical URL of your site. Defaults to `http://localhost:43111` in development (or `http://<NEXT_PUBLIC_APP_HOST>:43111` when overridden). Required in production.
   - `NEXT_PUBLIC_APP_HOST` – (optional) host name used to derive the default `NEXTAUTH_URL`. Set this when you need a specific development domain (for example, `app.localhost`).
4. Generate typed operations: `yarn codegen`.
5. Launch the development server: `yarn dev`.

## Available scripts
- `yarn dev` – Next.js dev server with hot reloading.
- `yarn lint` – runs `next lint` with the shared ESLint configuration.
- `yarn test` – executes Jest + React Testing Library with MSW-backed GraphQL mocks.
- `yarn test:e2e` – runs the Playwright suite that mirrors our high-value Capybara flows.
- `yarn coverage` – runs Jest with coverage thresholds.
- `yarn codegen` – invokes GraphQL Code Generator (see `codegen.ts`).

## GraphQL contract
- **Entry points:** `viewer`, `node`, `nodes`, singular fetchers (`user`, `supplier`, `customer`, `product`, `order`, `productRequest`, `invoice`, `invoiceLineItem`, `magicInvoiceSubmission`) and their connection counterparts (`users`, `suppliers`, `customers`, `products`, `orders`, `productRequests`, `invoices`, `invoiceLineItems`, `magicInvoiceSubmissions`). Filters cover status enums, supplier/customer IDs, and ISO 8601 timestamp ranges.
- **Mutations:** `createOrder`, `updateOrderStatus`, and `submitMagicInvoice` power order creation, lifecycle transitions, and the magic ingestion pipeline. Centralize documents in `src/graphql/` and consume them via generated hooks.
- **Schema sync:** In the Rails repo run `bundle exec rails graphql:schema:dump --out app/graphql/schema.graphql && cp app/graphql/schema.graphql docs/graphql/schema.graphql`, then copy `docs/graphql/schema.graphql` into this repo’s `graphql/schema.graphql` before re-running `yarn codegen`.

## Domain overview
- **Users** – Devise accounts owning suppliers, customers, orders, products, product requests, and magic submissions.
- **Suppliers** – Vendor profiles with catalog spreadsheets and ownership of products, orders, product requests, and invoices.
- **Customers** – Buyer accounts with unique codes, latest-order pointers, and invoice relationships.
- **Products** – Supplier-scoped catalog items with pricing, stock, and product-request relationships.
- **Orders** – Purchasing workflow (statuses: `draft`, `pending`, `fulfilled`, `cancelled`) with totals, attachments, product requests, and invoice associations.
- **Product Requests** – Line items that bridge products to orders/customers while tracking quantities, unit prices, and supplier context.
- **Invoices & Invoice Line Items** – Billing aggregates with generation methods, totals, attachments, and ties back to orders/product requests.
- **Magic Invoice Submissions** – File ingestion records with status transitions, parser payloads, and attachments.

## Testing strategy
- Jest + React Testing Library (with MSW) for components, hooks, and API adapters. Enforce ≥80% statement coverage.
- Authentication coverage:
  - `app/(auth)/signin/SignInForm.test.tsx` and `app/(auth)/signup/SignUpForm.test.tsx` assert client-side validation, integration with NextAuth helpers, and redirects on success.
  - Tests rely on the shared MSW handlers registered in `src/mocks/handlers.ts`, which power both Jest and Playwright suites.
- Playwright end-to-end journeys covering order creation, invoice lifecycle, magic submission uploads, and the new authentication flows in `tests/e2e/auth.spec.ts`. Ensure browsers are provisioned via `yarn playwright install-deps` and `yarn playwright install` before running `yarn test:e2e`.
- CI should execute `yarn codegen && yarn lint && yarn test && yarn test:e2e` before merge.

### Updating MSW fixtures
- Centralize GraphQL auth mocks in:
- `src/mocks/handlers/auth.ts` – signIn, signUp, and signOut mutations.
  - `src/mocks/handlers/dashboard.ts` – viewer query used for session bootstrapping.
  - `app/api/mock/graphql/route.ts` – local GraphQL endpoint consumed during Playwright runs.
- When backend auth contracts change, update the fixtures above, then re-run `yarn lint`, `yarn test`, and `yarn test:e2e` to confirm parity across component, integration, and E2E suites.

### E2E Testing with Real GraphQL API
- By default, E2E tests use mocked GraphQL endpoints via `app/api/mock/graphql/route.ts`.
- To test against a real GraphQL API, set `GRAPHQL_SERVER_URL` before running tests so the proxy forwards to your backend:
  ```bash
  GRAPHQL_SERVER_URL=http://localhost:3000/graphql yarn test:e2e
  ```
- When targeting the mocked endpoint (default), the suite signs in with the bundled mock account (`admin@example.com` / `password123`).
- When `GRAPHQL_SERVER_URL` points at a real API, the harness automatically provisions a throwaway account for the run by generating unique credentials with `@faker-js/faker` and `crypto.randomUUID()`, registering them via GraphQL, and reusing the session across specs. No manual cleanup or additional environment variables are required.
- Sign-up flows are automatically stubbed in Playwright when targeting a real GraphQL API so we don't create persistent accounts during CI runs beyond the throwaway credential described above.
- When using a real API, test timeouts are automatically increased (from 60s to 90s) to accommodate network latency.
- Ensure your local GraphQL API is running and accessible before running E2E tests with real endpoints.
- The viewer query is used for dashboard authentication—ensure your API supports the `viewer` query with proper cookie-based authentication.

## Conventions
- Use functional React components with hooks and co-located fragments.
- Keep GraphQL documents under `src/graphql/` and regenerate artifacts after schema changes.
- Update this README whenever GraphQL operations, environment variables, or domain entities evolve.

## Troubleshooting

### JWT Decryption Errors
If you encounter "decryption operation failed" errors during signin/signup:
- Ensure `NEXTAUTH_SECRET` is set and remains consistent across sessions.
- Clear browser cookies and restart the development server if the secret changed.
- In development, a default secret is used if `NEXTAUTH_SECRET` is not set. In production, always set a strong, random secret.

### Port 3000 Redirect Issues
If redirects go to `localhost:3000` instead of the configured port:
- Set `NEXTAUTH_URL` explicitly: `NEXTAUTH_URL=http://localhost:43111` (or your configured port/host).
- The app defaults to port 43111 in development; ensure `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_HOST` (when set) match your actual host and port.

### E2E Test Timeouts
If E2E tests timeout when redirecting to dashboard:
- Test timeouts are automatically increased when using real GraphQL API (`GRAPHQL_SERVER_URL`).
- Ensure your GraphQL API responds within reasonable timeframes.
- Check that the viewer query completes successfully for authenticated users.

## Additional references
- Backend GraphQL docs (`docs/graphql/` in the Rails repository).
- `database-architecture.md` for deeper relational details.
