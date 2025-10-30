# GraphQL Service Module Catalog

This guide maps schema catalog entries to the frontend service modules maintained in `src/services/graphql/`. Use it when planning new domains so mocks, tests, and runtime clients stay aligned.

## Current coverage

| Domain | Operations | Service module | Shared mocks | Notes |
| --- | --- | --- | --- | --- |
| Authentication | `signIn`, `signUp`, `signOut`, `viewer` | `src/services/graphql/auth/` | `tests/mocks/services/auth.ts`, `src/mocks/handlers/auth.ts`, `app/api/mock/graphql/route.ts` | Registry-driven mocks reuse the service descriptors for MSW and Playwright.

## Extending the catalog

1. Create a domain folder under `src/services/graphql/` (for example, `orders/`, `suppliers/`, or `products/`). Co-locate each operation in its own file exporting a `GraphQLService`.
2. Export the services from the domain `index.ts` and from `src/services/graphql/index.ts`.
3. Mirror the domain in `tests/mocks/services/` by building a registry file that imports the services, parses variables, and produces mock responses. Reuse those mocks in any MSW handler under `src/mocks/handlers/` or API routes in `app/api/mock/graphql/`.
4. Update this document with the new domain so other teams can see which operations are already implemented in the frontend service layer.

Following this pattern keeps catalog changes discoverable while guaranteeing that runtime clients, Jest suites, and Playwright fixtures always use the same GraphQL operation definitions.
