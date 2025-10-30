jest.mock("@/src/services/graphql/core", () => {
  const actual = jest.requireActual("@/src/services/graphql/core");
  return {
    ...actual,
    executeGraphQLService: jest.fn(),
  };
});

import {
  executeGraphQLService,
  GraphQLRequestError,
  type GraphQLRequestSuccess,
} from "@/src/services/graphql/core";
import {
  signInService,
  signOutService,
  signUpService,
  viewerService,
  type SignInServiceData,
  type SignOutServiceData,
  type SignUpServiceData,
  type ViewerServiceData,
} from "@/src/services/graphql/auth";

import { AuthRequestError, fetchViewer, signIn, signOut, signUp } from "./api";
import type { AuthUser, SignInPayload, SignUpPayload, UserErrorPayload } from "./types";

const executeGraphQLServiceMock = executeGraphQLService as jest.MockedFunction<
  typeof executeGraphQLService
>;

describe("auth API wrappers", () => {
  const userFixture: AuthUser = {
    id: "user-id",
    email: "person@example.com",
    name: "Ada Lovelace",
  };

  const graphQLSuccess = <TData,>(
    data: TData,
    setCookies: string[] = [],
  ): GraphQLRequestSuccess<TData> => ({ data, setCookies });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signIn", () => {
    const payload: SignInPayload = {
      email: "person@example.com",
      password: "correct horse battery staple",
    };

    it("delegates to the sign-in service and returns the viewer", async () => {
      executeGraphQLServiceMock.mockResolvedValueOnce(
        graphQLSuccess<SignInServiceData>({
          signIn: { user: userFixture, userErrors: [] },
        }),
      );

      const result = await signIn(payload);

      expect(executeGraphQLServiceMock).toHaveBeenCalledWith(signInService, payload, {});
      expect(result).toEqual({ user: userFixture, userErrors: [], setCookies: [] });
    });

    it("normalizes user errors from the response", async () => {
      const userErrors: UserErrorPayload[] = [
        { message: "Invalid email", path: ["credentials", "email"] },
      ];

      executeGraphQLServiceMock.mockResolvedValueOnce(
        graphQLSuccess<SignInServiceData>({
          signIn: { user: null, userErrors },
        }),
      );

      const result = await signIn(payload);

      expect(result.userErrors).toEqual([
        {
          message: "Invalid email",
          path: ["credentials", "email"],
          kind: "VALIDATION",
        },
      ]);
    });

    it("propagates locale overrides to the executor", async () => {
      executeGraphQLServiceMock.mockResolvedValueOnce(
        graphQLSuccess<SignInServiceData>({
          signIn: { user: userFixture, userErrors: [] },
        }),
      );

      await signIn(payload, { locale: "es" });

      expect(executeGraphQLServiceMock).toHaveBeenCalledWith(
        signInService,
        payload,
        { locale: "es" },
      );
    });

    it("throws when the sign-in payload is missing", async () => {
      executeGraphQLServiceMock.mockResolvedValueOnce(
        graphQLSuccess<SignInServiceData>({ signIn: null }),
      );

      await expect(signIn(payload)).rejects.toMatchObject({
        name: "AuthRequestError",
        message: "Authentication response did not include a sign-in payload",
      });
    });

    it("wraps GraphQL request errors in AuthRequestError", async () => {
      const graphQlError = new GraphQLRequestError("Invalid credentials", {
        status: 401,
        details: [{ message: "Invalid credentials" }],
      });
      executeGraphQLServiceMock.mockRejectedValueOnce(graphQlError);

      expect.assertions(2);
      try {
        await signIn(payload);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthRequestError);
        expect(error).toMatchObject({
          status: 401,
          details: [{ message: "Invalid credentials" }],
        });
      }
    });
  });

  describe("signUp", () => {
    const payload: SignUpPayload = {
      email: "person@example.com",
      name: "Ada Lovelace",
      password: "correct horse battery staple",
      passwordConfirmation: "correct horse battery staple",
    };

    it("delegates to the sign-up service", async () => {
      executeGraphQLServiceMock.mockResolvedValueOnce(
        graphQLSuccess<SignUpServiceData>({
          signUp: { user: userFixture, userErrors: [] },
        }, ["session=abc123"]),
      );

      const result = await signUp(payload);

      expect(executeGraphQLServiceMock).toHaveBeenCalledWith(signUpService, payload, {});
      expect(result).toEqual({
        user: userFixture,
        userErrors: [],
        setCookies: ["session=abc123"],
      });
    });

    it("throws when the sign-up payload is missing", async () => {
      executeGraphQLServiceMock.mockResolvedValueOnce(
        graphQLSuccess<SignUpServiceData>({ signUp: null }),
      );

      await expect(signUp(payload)).rejects.toMatchObject({
        name: "AuthRequestError",
        message: "Registration response did not include a sign-up payload",
      });
    });
  });

  describe("signOut", () => {
    it("passes headers and locale through to the executor", async () => {
      executeGraphQLServiceMock.mockResolvedValueOnce(
        graphQLSuccess<SignOutServiceData>({
          signOut: { user: null, userErrors: [] },
        }, ["session=cleared"]),
      );

      const options = { headers: { cookie: "session=abc123" }, locale: "es" } as const;
      const result = await signOut(options);

      expect(executeGraphQLServiceMock).toHaveBeenCalledWith(
        signOutService,
        undefined,
        options,
      );
      expect(result).toEqual({ user: null, userErrors: [], setCookies: ["session=cleared"] });
    });

    it("throws when the sign-out payload is missing", async () => {
      executeGraphQLServiceMock.mockResolvedValueOnce(
        graphQLSuccess<SignOutServiceData>({ signOut: null }),
      );

      await expect(signOut()).rejects.toMatchObject({
        name: "AuthRequestError",
        message: "Sign-out response did not include a payload",
      });
    });
  });

  describe("fetchViewer", () => {
    it("delegates to the viewer service and returns the user", async () => {
      executeGraphQLServiceMock.mockResolvedValueOnce(
        graphQLSuccess<ViewerServiceData>({ viewer: userFixture }),
      );

      const result = await fetchViewer();

      expect(executeGraphQLServiceMock).toHaveBeenCalledWith(viewerService, undefined, {});
      expect(result).toEqual(userFixture);
    });

    it("passes headers and locale overrides", async () => {
      executeGraphQLServiceMock.mockResolvedValueOnce(
        graphQLSuccess<ViewerServiceData>({ viewer: userFixture }),
      );

      await fetchViewer({ headers: { cookie: "session=abc123" }, locale: "es" });

      expect(executeGraphQLServiceMock).toHaveBeenLastCalledWith(
        viewerService,
        undefined,
        { headers: { cookie: "session=abc123" }, locale: "es" },
      );
    });

    it("wraps GraphQL request errors", async () => {
      const graphQlError = new GraphQLRequestError("Unauthorized", { status: 401 });
      executeGraphQLServiceMock.mockRejectedValueOnce(graphQlError);

      await expect(fetchViewer()).rejects.toMatchObject({
        name: "AuthRequestError",
        status: 401,
      });
    });

    it("returns null when the viewer is missing", async () => {
      executeGraphQLServiceMock.mockResolvedValueOnce(
        graphQLSuccess<ViewerServiceData>({ viewer: null }),
      );

      await expect(fetchViewer()).resolves.toBeNull();
    });
  });
});
