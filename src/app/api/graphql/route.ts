import { createYoga } from "graphql-yoga";
import { GraphQLError } from "graphql";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { schema } from "@/lib/graphql/schema";

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  graphiql: false,
  cors: false,
  context: async () => {
    const db = await createClient();
    const {
      data: { user },
      error,
    } = await db.auth.getUser();
    if (error || !user)
      throw new GraphQLError("Entre na sua conta para continuar.", {
        extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
      });
    return { db, userId: user.id };
  },
});

export async function POST(request: Request) {
  if (!getSupabaseConfig())
    return Response.json(
      { errors: [{ message: "Serviço indisponível. Tente novamente mais tarde." }] },
      { status: 503 },
    );
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return new Response(null, { status: 415 });
  const body = await request.text();
  if (new TextEncoder().encode(body).length > 65536) return new Response(null, { status: 413 });
  const response = await yoga.handleRequest(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body,
    }),
    {},
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
