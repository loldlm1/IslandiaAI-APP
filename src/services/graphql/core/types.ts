export interface GraphQLRequestPayload<TVariables> {
  query: string;
  variables?: TVariables;
  operationName?: string;
}

export interface GraphQLRequestOptions {
  headers?: HeadersInit;
  locale?: string | null;
}

export interface GraphQLResponseEnvelope<TData> {
  data?: TData;
  errors?: GraphQLErrorResponse[];
}

export interface GraphQLRequestSuccess<TData> {
  data: TData;
  setCookies: string[];
}

export interface GraphQLErrorResponse {
  message: string;
  path?: (string | number)[];
}

export interface GraphQLUserErrorPayload extends GraphQLErrorResponse {
  path?: (string | number)[];
}

export interface GraphQLUserError extends GraphQLErrorResponse {
  kind: GraphQLUserErrorKind;
  path: (string | number)[];
  resource?: GraphQLDeleteFailureResource;
}

export type GraphQLUserErrorKind =
  | "VALIDATION"
  | "AUTHENTICATION_REQUIRED"
  | "NOT_SIGNED_IN"
  | "INVALID_CREDENTIALS"
  | "DELETE_FAILED"
  | "INVALID_DECIMAL"
  | "UNKNOWN";

export type GraphQLDeleteFailureResource =
  | "CUSTOMER"
  | "ORDER"
  | "PRODUCT"
  | "PRODUCT_REQUEST"
  | "SUPPLIER"
  | "UNKNOWN";

export interface GraphQLTopLevelError extends GraphQLErrorResponse {
  kind: GraphQLTopLevelErrorKind;
}

export type GraphQLTopLevelErrorKind =
  | "AUTHENTICATION_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "UNKNOWN";

export interface GraphQLNormalizedErrorPayload {
  topLevel: GraphQLTopLevelError[];
  userErrors: GraphQLUserError[];
}

export interface GraphQLService<TInput, TVariables = Record<string, unknown> | undefined> {
  operationName: string;
  document: string;
  buildVariables?: (input: TInput) => TVariables;
}

export interface GraphQLClient {
  execute<TData, TVariables = Record<string, unknown>>(
    payload: GraphQLRequestPayload<TVariables>,
    options?: GraphQLRequestOptions,
  ): Promise<GraphQLRequestSuccess<TData>>;
}

export interface ExecuteGraphQLServiceOptions extends GraphQLRequestOptions {
  client?: GraphQLClient;
}
