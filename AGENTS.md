# Agent Instructions

## Toolchain
- Node.js 20.19.4 and Yarn 1.22.22 (install via `asdf install`).
- Next.js 14 + TypeScript with the default `next lint` ruleset and Prettier formatting.
- Prettier formatting uses the default 2-space indentation (`tabWidth: 2`). Configure your editor to match and to trim trailing whitespace on save (e.g., via EditorConfig `indent_size = 2` and `trim_trailing_whitespace = true`).

## Setup workflow
1. Run `yarn install`.
2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_GRAPHQL_URL` to the Rails GraphQL endpoint.
   - `GRAPHQL_SCHEMA_PATH=graphql/schema.graphql`.
3. Ensure `graphql/schema.graphql` matches the Rails snapshot; regenerate it when backend changes land (see “Schema sync”).
4. Execute `yarn codegen` before working on GraphQL-dependent code.

## Playwright prerequisites
- Run `yarn playwright install-deps` (fresh containers) followed by `yarn playwright install` before `yarn test:e2e` so the Playwright-managed browsers and their libraries are available.
- If `yarn playwright install-deps` is unavailable, install the following packages via apt: `libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libxkbcommon0 libatspi2.0-0t64 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64` plus their transitive dependencies.

## Daily commands
- `yarn dev` for the Next.js dev server.
- `yarn lint` (fails on ESLint violations).
- `yarn test` for Jest + React Testing Library with MSW.
- `yarn coverage` to confirm coverage thresholds.
- `yarn test:e2e` to run Playwright system flows.
All quality gates must pass before committing.

## Schema sync
- From the Rails repo: `bundle exec rails graphql:schema:dump --out app/graphql/schema.graphql && cp app/graphql/schema.graphql docs/graphql/schema.graphql`.
- Copy the refreshed `docs/graphql/schema.graphql` into this repo’s `graphql/schema.graphql`.
- Re-run `yarn codegen` whenever the schema changes.

## GraphQL and domain context
- Queries available: `viewer`, `node`, `nodes`, and domain fetchers for users, suppliers, customers, products, orders, product requests, invoices, invoice line items, and magic invoice submissions (with status/date filters).
- Mutations: `createOrder`, `updateOrderStatus`, `submitMagicInvoice`.
- Domain entities mirror the Rails architecture (users own suppliers/customers/products/orders; orders link product requests and invoices; invoices/line items reconcile financials; magic invoice submissions track ingestion status).
- Keep GraphQL documents in `src/graphql/` and prefer generated hooks for data access.

## Pull request checklist
- Lint, unit, coverage, and Playwright suites pass locally.
- Schema snapshot and generated artifacts updated when backend contracts change.
- MSW fixtures/playwright mocks refreshed to match new fields.
- README / docs updated for new environment variables or workflows.
