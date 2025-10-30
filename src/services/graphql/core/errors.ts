import type { GraphQLErrorResponse, GraphQLTopLevelError } from "./types";

export interface GraphQLRequestErrorOptions {
  status?: number;
  details?: GraphQLErrorResponse[];
  topLevelErrors?: GraphQLTopLevelError[];
  cause?: unknown;
}

export class GraphQLRequestError extends Error {
  public readonly status?: number;
  public readonly details?: GraphQLErrorResponse[];
  public readonly topLevelErrors: GraphQLTopLevelError[];

  constructor(message: string, options: GraphQLRequestErrorOptions = {}) {
    super(message);
    this.name = "GraphQLRequestError";
    this.status = options.status;
    this.details = options.details;
    this.topLevelErrors = options.topLevelErrors ?? [];

    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}
