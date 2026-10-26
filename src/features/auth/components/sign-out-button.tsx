"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useApolloClient } from "@apollo/client/react";
import { useHydrated } from "@/hooks/use-hydrated";

export function SignOutButton() {
  const client = useApolloClient();
  const hydrated = useHydrated();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function signOut() {
    setPending(true);
    setError(false);
    try {
      const { error } = await createClient().auth.signOut({ scope: "local" });
      if (error) throw error;
      await client.clearStore();
      router.replace("/entrar");
      router.refresh();
    } catch {
      setPending(false);
      setError(true);
    }
  }

  return (
    <div className="text-right">
      <Button variant="ghost" onClick={signOut} disabled={pending || !hydrated}>
        {pending ? "Saindo..." : "Sair"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível sair. Tente novamente.
        </p>
      )}
    </div>
  );
}
