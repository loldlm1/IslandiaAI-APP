const DEFAULT_GRAPHQL_ENDPOINT = "/api/graphql";
const DEVELOPMENT_BASE_URL = `http://127.0.0.1:${process.env.PORT ?? "43111"}`;

function toAbsoluteUrl(url: string): string {
  try {
    return new URL(url).toString();
  } catch {
    const baseUrl = process.env.NEXTAUTH_URL ?? DEVELOPMENT_BASE_URL;
    return new URL(url, baseUrl).toString();
  }
}

export function resolveClientGraphQLEndpoint(): string {
  return process.env.NEXT_PUBLIC_GRAPHQL_URL ?? DEFAULT_GRAPHQL_ENDPOINT;
}

export function resolveServerGraphQLEndpoint(): string {
  const endpoint = process.env.GRAPHQL_SERVER_URL ?? resolveClientGraphQLEndpoint();
  return toAbsoluteUrl(endpoint);
}

export function resolveGraphQLEndpoint(): string {
  const isServerEnvironment =
    typeof window === "undefined" || process.env.GRAPHQL_SERVER_URL !== undefined;

  return isServerEnvironment
    ? resolveServerGraphQLEndpoint()
    : resolveClientGraphQLEndpoint();
}
