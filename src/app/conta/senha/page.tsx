import { ProtectedShell } from "@/features/auth/components/protected-shell";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata = { title: "Minha conta" };
export default function PasswordPage() {
  return (
    <ProtectedShell next="/conta/senha">
      <main className="mx-auto max-w-lg space-y-6 px-6 py-12">
        <h1 className="text-3xl font-semibold">Alterar senha</h1>
        <AuthForm mode="password" />
      </main>
    </ProtectedShell>
  );
}
