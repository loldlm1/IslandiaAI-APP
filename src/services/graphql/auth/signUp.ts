import type { GraphQLService } from "../core";

export interface SignUpServiceInput {
  email: string;
  name: string;
  password: string;
  passwordConfirmation: string;
}

export interface SignUpServiceVariables {
  input: {
    attributes: {
      email: string;
      name: string;
      password: string;
      passwordConfirmation: string;
    };
  };
}

export interface SignUpServiceUser {
  id: string;
  email: string;
  name: string;
}

export interface SignUpServiceUserError {
  message: string;
  path?: (string | number)[];
}

export interface SignUpServiceData {
  signUp?: {
    user?: SignUpServiceUser | null;
    userErrors?: SignUpServiceUserError[];
  } | null;
}

export const SIGN_UP_MUTATION = /* GraphQL */ `
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
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

export const signUpService: GraphQLService<SignUpServiceInput, SignUpServiceVariables> = {
  operationName: "SignUp",
  document: SIGN_UP_MUTATION,
  buildVariables: (input) => ({
    input: {
      attributes: {
        email: input.email,
        name: input.name,
        password: input.password,
        passwordConfirmation: input.passwordConfirmation,
      },
    },
  }),
};
