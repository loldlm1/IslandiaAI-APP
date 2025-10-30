const DEFAULT_GRAPHQL_GATEWAY_ENDPOINT = "/api/graphql";
const DEVELOPMENT_BASE_URL = `http://127.0.0.1:${process.env.PORT ?? "43111"}`;

function toAbsoluteUrl(url: string): string {
  try {
    return new URL(url).toString();
  } catch {
    const baseUrl = process.env.NEXTAUTH_URL ?? DEVELOPMENT_BASE_URL;
    return new URL(url, baseUrl).toString();
  }
}

export function resolveGraphQLGatewayEndpoint(): string {
  return process.env.NEXT_PUBLIC_GRAPHQL_URL ?? DEFAULT_GRAPHQL_GATEWAY_ENDPOINT;
}

export function resolveClientGraphQLEndpoint(): string {
  return resolveGraphQLGatewayEndpoint();
}

export function resolveServerGraphQLEndpoint(): string {
  const upstreamEndpoint = process.env.GRAPHQL_SERVER_URL;
  if (upstreamEndpoint) {
    return toAbsoluteUrl(upstreamEndpoint);
  }

  const gatewayEndpoint = resolveGraphQLGatewayEndpoint();
  return toAbsoluteUrl(gatewayEndpoint);
}

export function resolveGraphQLEndpoint(): string {
  const isServerEnvironment =
    typeof globalThis.window === "undefined" || process.env.GRAPHQL_SERVER_URL !== undefined;

  return isServerEnvironment
    ? resolveServerGraphQLEndpoint()
    : resolveClientGraphQLEndpoint();
}

