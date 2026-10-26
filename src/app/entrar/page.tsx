import { AuthPage } from "@/features/auth/components/auth-page";
import { AuthForm } from "@/features/auth/components/auth-form";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { safeNext } from "@/features/auth/lib/safe-next";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthPage
      title="Sua próxima viagem começa aqui."
      description="Entre para organizar destinos, combinar passeios e decidir o roteiro com seus amigos."
    >
      {params.error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          O link expirou ou não é válido. Solicite um novo link e abra no mesmo navegador.
        </p>
      )}
      <AuthForm
        mode="login"
        next={safeNext(params.next)}
        configured={Boolean(getSupabaseConfig())}
      />
    </AuthPage>
  );
}
