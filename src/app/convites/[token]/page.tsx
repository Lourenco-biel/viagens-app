import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ProtectedShell } from "@/features/auth/components/protected-shell";
import { AcceptInvite } from "@/features/trips/components/accept-invite";

export const metadata = { title: "Convite de viagem", robots: { index: false, follow: false } };
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!z.uuid().safeParse(token).success) notFound();
  return (
    <ProtectedShell next={"/convites/" + token}>
      <main className="mx-auto max-w-lg space-y-6 px-6 py-16">
        <h1 className="text-3xl font-semibold">Vamos viajar juntos?</h1>
        <AcceptInvite token={token} />
        <Link href="/viagens" className="inline-block text-sm underline underline-offset-4">
          Voltar às viagens
        </Link>
      </main>
    </ProtectedShell>
  );
}
