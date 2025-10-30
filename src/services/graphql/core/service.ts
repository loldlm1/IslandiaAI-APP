import { DEFAULT_LOCALE } from "@/src/lib/locale/constants";
import { normalizeLocale } from "@/src/lib/locale/utils";

import { extractSetCookies } from "./cookies";
import { resolveGraphQLEndpoint } from "./endpoints";
import { GraphQLRequestError } from "./errors";
import { normalizeTopLevelErrors } from "./errorMapping";
import type {
  GraphQLRequestOptions,
  GraphQLRequestPayload,
  GraphQLRequestSuccess,
  GraphQLResponseEnvelope,
  GraphQLService,
} from "./types";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  let text: string;

  try {
    text = await response.text();
  } catch (error) {
    throw new GraphQLRequestError("Unable to read GraphQL response", {
      status: response.status,
      cause: error,
    });
  }

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new GraphQLRequestError("Unable to parse GraphQL response", {
      status: response.status,
      cause: error,
    });
  }
}

export function createGraphQLService(fetchImpl: typeof fetch = globalThis.fetch): GraphQLService {
  return {
    async execute<TData, TVariables = Record<string, unknown>>(
      payload: GraphQLRequestPayload<TVariables>,
      options: GraphQLRequestOptions = {},
    ): Promise<GraphQLRequestSuccess<TData>> {
      const locale = normalizeLocale(options.locale ?? DEFAULT_LOCALE);
      const endpoint = resolveGraphQLEndpoint();
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          ...JSON_HEADERS,
          ...options.headers,
        },
        body: JSON.stringify({
          ...payload,
          locale,
        }),
        cache: "no-store",
        credentials: "include",
      });

      const json =
        (await parseJsonResponse<GraphQLResponseEnvelope<TData>>(response)) ?? {};
      const setCookies = extractSetCookies(response);

      if (!response.ok) {
        const topLevelErrors = normalizeTopLevelErrors(json.errors);
        throw new GraphQLRequestError("GraphQL request failed", {
          status: response.status,
          details: json.errors,
          topLevelErrors,
        });
      }

      if (json.errors?.length) {
        const topLevelErrors = normalizeTopLevelErrors(json.errors);
        const message = json.errors[0]?.message || "Unexpected GraphQL error";
        throw new GraphQLRequestError(message, {
          status: response.status,
          details: json.errors,
          topLevelErrors,
        });
      }

      if (!json.data) {
        throw new GraphQLRequestError("GraphQL response did not include data", {
          status: response.status,
        });
      }

      return { data: json.data, setCookies };
    },
  };
}

export const graphQLService = createGraphQLService();
