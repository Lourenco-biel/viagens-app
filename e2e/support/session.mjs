export const user = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "study@example.test",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { name: "Gabriel" },
  created_at: "2026-01-01T00:00:00Z",
  identities: [],
};
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
export const token =
  encode({ alg: "HS256", typ: "JWT" }) +
  "." +
  encode({
    sub: user.id,
    aud: "authenticated",
    role: "authenticated",
    iat: 1767225600,
    exp: 4102444800,
  }) +
  ".dGVzdA";
export const session = {
  access_token: token,
  token_type: "bearer",
  expires_in: 3600,
  expires_at: 4102444800,
  refresh_token: "e2e-refresh",
  user,
};
