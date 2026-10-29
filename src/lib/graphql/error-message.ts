import { CombinedGraphQLErrors } from "@apollo/client/errors";

export function errorMessage(error: unknown) {
  if (CombinedGraphQLErrors.is(error)) {
    const known = error.errors.find((item) =>
      [
        "BAD_USER_INPUT",
        "FORBIDDEN",
        "NOT_FOUND",
        "UNAUTHENTICATED",
        "OPERATION_FAILED",
        "CONFLICT",
      ].includes(String(item.extensions?.code)),
    );
    if (known) return known.message;
  }
  return "Não foi possível concluir a ação. Verifique sua conexão e tente novamente.";
}
