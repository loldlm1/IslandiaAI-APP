import type { GraphQLService } from "../core";

export interface SignInServiceInput {
  email: string;
  password: string;
}

export interface SignInServiceVariables {
  input: {
    credentials: {
      email: string;
      password: string;
    };
  };
}

export interface SignInServiceUser {
  id: string;
  email: string;
  name: string;
}

export interface SignInServiceUserError {
  message: string;
  path?: (string | number)[];
}

export interface SignInServiceData {
  signIn?: {
    user?: SignInServiceUser | null;
    userErrors?: SignInServiceUserError[];
  } | null;
}

export const SIGN_IN_MUTATION = /* GraphQL */ `
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
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

export const signInService: GraphQLService<SignInServiceInput, SignInServiceVariables> = {
  operationName: "SignIn",
  document: SIGN_IN_MUTATION,
  buildVariables: (input) => ({
    input: {
      credentials: {
        email: input.email,
        password: input.password,
      },
    },
  }),
};
