export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignInResult {
  user: AuthUser | null;
  userErrors: UserError[];
  setCookies: string[];
}

export interface SignUpPayload {
  email: string;
  name: string;
  password: string;
  passwordConfirmation: string;
}

export interface SignUpResult {
  user: AuthUser | null;
  userErrors: UserError[];
  setCookies: string[];
}

export interface ViewerResult {
  viewer: AuthUser | null;
}

export interface GraphQLErrorResponse {
  message: string;
  path?: (string | number)[];
}

export interface SignOutResult {
  user: AuthUser | null;
  userErrors: UserError[];
  setCookies: string[];
}

export interface UserError extends GraphQLErrorResponse {
  path: string[];
}
