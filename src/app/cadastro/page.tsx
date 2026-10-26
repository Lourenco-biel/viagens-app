import { AuthPage } from "@/features/auth/components/auth-page";
import { AuthForm } from "@/features/auth/components/auth-form";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { safeNext } from "@/features/auth/lib/safe-next";

export const metadata = { title: "Criar conta" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthPage
      title="Planeje boas histórias."
      description="Crie sua conta para organizar uma viagem sozinho ou convidar sua turma."
    >
      <AuthForm mode="signup" next={safeNext(next)} configured={Boolean(getSupabaseConfig())} />
    </AuthPage>
  );
}
