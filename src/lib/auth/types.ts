export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string | null;
  tokenType: string;
  expiresIn: number;
  createdAt?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export type LoginResult = AuthTokens;

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
