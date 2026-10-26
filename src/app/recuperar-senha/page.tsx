import { AuthPage } from "@/features/auth/components/auth-page";
import { AuthForm } from "@/features/auth/components/auth-form";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata = { title: "Recuperar senha" };
export default function ResetPage() {
  return (
    <AuthPage
      title="Vamos recuperar seu acesso."
      description="Enviaremos um link para você escolher uma nova senha."
    >
      <AuthForm mode="reset" configured={Boolean(getSupabaseConfig())} />
    </AuthPage>
  );
}
