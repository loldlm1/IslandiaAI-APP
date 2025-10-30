import {
  type GraphQLDeleteFailureResource,
  type GraphQLErrorResponse,
  type GraphQLNormalizedErrorPayload,
  type GraphQLTopLevelError,
  type GraphQLTopLevelErrorKind,
  type GraphQLUserError,
  type GraphQLUserErrorKind,
  type GraphQLUserErrorPayload,
} from "./types";

const AUTHENTICATION_REQUIRED_MESSAGES = new Set([
  "You must be signed in to perform this action.",
  "Debes iniciar sesión para realizar esta acción.",
]);

const FORBIDDEN_MARKERS = [
  "You are not authorized to access this",
  "No tienes autorización para acceder a este",
];

const NOT_FOUND_MARKERS = [
  "could not be found",
  "No se pudo encontrar",
];

const NOT_SIGNED_IN_MESSAGES = new Set([
  "You are not signed in.",
  "No has iniciado sesión.",
]);

const INVALID_CREDENTIALS_MESSAGES = new Set([
  "Invalid email or password.",
  "Correo electrónico o contraseña inválidos.",
]);

const DELETE_FAILURE_MESSAGES: Record<string, GraphQLDeleteFailureResource> = {
  "Customer could not be deleted.": "CUSTOMER",
  "No se pudo eliminar el cliente.": "CUSTOMER",
  "Order could not be deleted.": "ORDER",
  "No se pudo eliminar el pedido.": "ORDER",
  "Product could not be deleted.": "PRODUCT",
  "No se pudo eliminar el producto.": "PRODUCT",
  "Product request could not be deleted.": "PRODUCT_REQUEST",
  "No se pudo eliminar la solicitud de producto.": "PRODUCT_REQUEST",
  "Supplier could not be deleted.": "SUPPLIER",
  "No se pudo eliminar el proveedor.": "SUPPLIER",
};

const INVALID_DECIMAL_MARKER = "not a valid decimal";

function normalizeTopLevelErrorKind(error: GraphQLErrorResponse): GraphQLTopLevelErrorKind {
  if (AUTHENTICATION_REQUIRED_MESSAGES.has(error.message)) {
    return "AUTHENTICATION_REQUIRED";
  }

  const message = error.message ?? "";
  if (FORBIDDEN_MARKERS.some((marker) => message.includes(marker))) {
    return "FORBIDDEN";
  }

  if (NOT_FOUND_MARKERS.some((marker) => message.includes(marker))) {
    return "NOT_FOUND";
  }

  return "UNKNOWN";
}

function normalizeDeleteResource(message: string): GraphQLDeleteFailureResource {
  return DELETE_FAILURE_MESSAGES[message] ?? "UNKNOWN";
}

function normalizeUserErrorKind(message: string): GraphQLUserErrorKind {
  if (AUTHENTICATION_REQUIRED_MESSAGES.has(message)) {
    return "AUTHENTICATION_REQUIRED";
  }

  if (NOT_SIGNED_IN_MESSAGES.has(message)) {
    return "NOT_SIGNED_IN";
  }

  if (INVALID_CREDENTIALS_MESSAGES.has(message)) {
    return "INVALID_CREDENTIALS";
  }

  if (DELETE_FAILURE_MESSAGES[message]) {
    return "DELETE_FAILED";
  }

  if (message.toLowerCase().includes(INVALID_DECIMAL_MARKER)) {
    return "INVALID_DECIMAL";
  }

  if (!message.trim()) {
    return "UNKNOWN";
  }

  return "VALIDATION";
}

export function normalizeTopLevelErrors(
  errors: GraphQLErrorResponse[] | undefined,
): GraphQLTopLevelError[] {
  if (!errors?.length) {
    return [];
  }

  return errors.map((error) => ({
    ...error,
    kind: normalizeTopLevelErrorKind(error),
  }));
}

export function normalizeUserErrors(
  errors: GraphQLUserErrorPayload[] | undefined,
): GraphQLUserError[] {
  if (!errors?.length) {
    return [];
  }

  return errors.map((error) => {
    const message = error.message ?? "";
    const kind = normalizeUserErrorKind(message);
    const normalized: GraphQLUserError = {
      ...error,
      kind,
      path: Array.isArray(error.path) ? error.path : [],
    };

    if (kind === "DELETE_FAILED") {
      normalized.resource = normalizeDeleteResource(message);
    }

    return normalized;
  });
}

export function normalizeGraphQLErrors({
  errors,
  userErrors,
}: {
  errors?: GraphQLErrorResponse[];
  userErrors?: GraphQLUserErrorPayload[];
}): GraphQLNormalizedErrorPayload {
  return {
    topLevel: normalizeTopLevelErrors(errors),
    userErrors: normalizeUserErrors(userErrors),
  };
}
