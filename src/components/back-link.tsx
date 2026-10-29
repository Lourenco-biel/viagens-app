import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <nav aria-label="Voltar" className="flex">
      <Link
        href={href}
        aria-label={label}
        className="group relative inline-flex size-11 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-14 z-10 w-max max-w-[calc(100vw-6rem)] rounded-md bg-foreground px-3 py-2 text-xs text-background opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          {label}
        </span>
      </Link>
    </nav>
  );
}
