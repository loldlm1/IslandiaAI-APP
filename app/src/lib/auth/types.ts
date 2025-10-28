export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  tokens: AuthTokens;
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
  organizationName?: string;
}

export interface RegisterResult {
  user: AuthUser;
}

export interface LogoutPayload {
  accessToken?: string;
}

export interface LogoutResult {
  success: boolean;
}

export interface ViewerResult {
  viewer: AuthUser;
}

export interface GraphQLErrorResponse {
  message: string;
}
