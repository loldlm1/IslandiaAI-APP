import type { GraphQLService } from "../core";

export type SignOutServiceInput = void;

export interface SignOutServiceVariables {
  input: Record<string, never>;
}

export interface SignOutServiceUser {
  id: string;
  email: string;
  name: string;
}

export interface SignOutServiceUserError {
  message: string;
  path?: (string | number)[];
}

export interface SignOutServiceData {
  signOut?: {
    user?: SignOutServiceUser | null;
    userErrors?: SignOutServiceUserError[];
  } | null;
}

export const SIGN_OUT_MUTATION = /* GraphQL */ `
  mutation SignOut($input: SignOutInput!) {
    signOut(input: $input) {
      user {
        id
        email
        name
      }
      userErrors {
        message
        path
      }
    }
  }
`;

export const signOutService: GraphQLService<SignOutServiceInput, SignOutServiceVariables> = {
  operationName: "SignOut",
  document: SIGN_OUT_MUTATION,
  buildVariables: () => ({
    input: {},
  }),
};
