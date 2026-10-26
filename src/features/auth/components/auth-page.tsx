import Link from "next/link";
import { Compass } from "lucide-react";
import type { ReactNode } from "react";

export function AuthPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto grid min-h-svh max-w-5xl items-center gap-12 px-6 py-12 md:grid-cols-2">
      <div className="space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xl font-semibold text-primary"
        >
          <Compass aria-hidden="true" />
          Viagens
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-md text-lg text-muted-foreground">{description}</p>
        <p className="text-sm text-muted-foreground">Um destino. Um roteiro. Todo mundo junto.</p>
      </div>
      <section aria-label={title} className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        {children}
      </section>
    </main>
  );
}
