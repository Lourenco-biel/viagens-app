import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EditTrip } from "@/features/trips/components/save-trip";

export const metadata = { title: "Editar viagem" };
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <Link href={"/viagens/" + id} className="text-sm underline underline-offset-4">
        Voltar ao roteiro
      </Link>
      <h1 className="text-3xl font-semibold">Editar viagem</h1>
      <EditTrip id={id} />
    </main>
  );
}
