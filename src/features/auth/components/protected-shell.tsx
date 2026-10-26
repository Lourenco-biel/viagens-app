import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { GraphQLProvider } from "@/lib/graphql/provider";
import { SignOutButton } from "./sign-out-button";

export async function ProtectedShell({
  children,
  next = "/viagens",
}: {
  children: ReactNode;
  next?: string;
}) {
  if (!getSupabaseConfig()) {
    return (
      <main className="mx-auto max-w-lg space-y-4 px-6 py-24">
        <Compass className="size-10 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Estamos preparando sua próxima viagem</h1>
        <p className="text-muted-foreground">
          O serviço ainda não está disponível. Volte em breve.
        </p>
      </main>
    );
  }
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/entrar?next=" + encodeURIComponent(next));

  return (
    <GraphQLProvider>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:block focus:p-3">
        Pular para o conteúdo
      </a>
      <div className="border-b bg-card">
        <nav
          aria-label="Navegação principal"
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
        >
          <Link href="/viagens" className="flex items-center gap-2 font-semibold text-primary">
            <Compass aria-hidden="true" />
            Viagens
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/conta/senha" className="text-sm underline underline-offset-4">
              Minha conta
            </Link>
            <SignOutButton />
          </div>
        </nav>
      </div>
      <div id="conteudo">{children}</div>
    </GraphQLProvider>
  );
}
