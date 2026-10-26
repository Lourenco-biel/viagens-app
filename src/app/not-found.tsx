import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg space-y-5 px-6 py-20">
      <h1 className="text-3xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">Confira o endereço ou volte para suas viagens.</p>
      <Link className={buttonVariants()} href="/viagens">
        Ver minhas viagens
      </Link>
    </main>
  );
}
