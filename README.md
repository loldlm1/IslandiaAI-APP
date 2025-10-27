# IslandiaAI Next.js Frontend

## Overview
This package contains the Next.js interface for IslandiaAI. It consumes the Rails GraphQL API via generated TypeScript hooks so we can reach feature parity with the existing dashboard experience.

## Prerequisites
- Node.js 20.17.0 (installable via `asdf install nodejs 20.17.0`)
- Yarn 1.22.22
- Access to an IslandiaAI backend environment that exposes the GraphQL endpoint.

## Quick start
1. Clone this repository and run `yarn install`.
2. Copy `.env.example` to `.env.local`, then set:
   - `NEXT_PUBLIC_GRAPHQL_URL` – the backend GraphQL endpoint (e.g., `http://localhost:3000/graphql`).
   - `GRAPHQL_SCHEMA_PATH=graphql/schema.graphql` – location of the shared SDL snapshot for code generation.
3. Generate typed operations: `yarn codegen`.
4. Launch the development server: `yarn dev`.

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
- Playwright end-to-end journeys covering order creation, invoice lifecycle, and magic submission uploads.
- CI should execute `yarn codegen && yarn lint && yarn test && yarn test:e2e` before merge.

## Conventions
- Use functional React components with hooks and co-located fragments.
- Keep GraphQL documents under `src/graphql/` and regenerate artifacts after schema changes.
- Update this README whenever GraphQL operations, environment variables, or domain entities evolve.

## Additional references
- Backend GraphQL docs (`docs/graphql/` in the Rails repository).
- `database-architecture.md` for deeper relational details.
