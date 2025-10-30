import {
  normalizeGraphQLErrors,
  normalizeTopLevelErrors,
  normalizeUserErrors,
} from "../errorMapping";
import type { GraphQLErrorResponse, GraphQLUserErrorPayload } from "../types";

describe("GraphQL error mapping", () => {
  it("classifies top-level authentication errors", () => {
    const errors: GraphQLErrorResponse[] = [
      { message: "You must be signed in to perform this action.", path: ["viewer"] },
      { message: "Unknown", path: [] },
    ];

    expect(normalizeTopLevelErrors(errors)).toEqual([
      {
        message: "You must be signed in to perform this action.",
        path: ["viewer"],
        kind: "AUTHENTICATION_REQUIRED",
      },
      { message: "Unknown", path: [], kind: "UNKNOWN" },
    ]);
  });

  it("decorates user errors with classification metadata", () => {
    const errors: GraphQLUserErrorPayload[] = [
      { message: "Invalid email or password.", path: ["credentials", "password"] },
      { message: "Value \"12.34a\" is not a valid decimal.", path: ["input", "amount"] },
      { message: "Customer could not be deleted.", path: [] },
      { message: "Email can't be blank", path: ["attributes", "email"] },
    ];

    expect(normalizeUserErrors(errors)).toEqual([
      {
        message: "Invalid email or password.",
        path: ["credentials", "password"],
        kind: "INVALID_CREDENTIALS",
      },
      {
        message: "Value \"12.34a\" is not a valid decimal.",
        path: ["input", "amount"],
        kind: "INVALID_DECIMAL",
      },
      {
        message: "Customer could not be deleted.",
        path: [],
        kind: "DELETE_FAILED",
        resource: "CUSTOMER",
      },
      {
        message: "Email can't be blank",
        path: ["attributes", "email"],
        kind: "VALIDATION",
      },
    ]);
  });

  it("returns empty arrays when no errors are present", () => {
    expect(normalizeGraphQLErrors({})).toEqual({ topLevel: [], userErrors: [] });
  });
});
