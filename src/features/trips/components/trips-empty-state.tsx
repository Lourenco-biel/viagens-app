import { Compass } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

type EmptyStateVariant = "no-trips" | "no-results";

type TripsEmptyStateProps = Readonly<{
  variant: EmptyStateVariant;
}>;

const content = {
  "no-trips": {
    title: "Suas próximas histórias começam aqui",
    description:
      "Você ainda não tem viagens. Quando criar uma, ela aparecerá nesta lista.",
  },
  "no-results": {
    title: "Nenhuma viagem encontrada",
    description:
      "Tente buscar outro nome ou destino, ou limpe os filtros para ver todas as viagens.",
  },
} satisfies Record<
  EmptyStateVariant,
  {
    title: string;
    description: string;
  }
>;

export function TripsEmptyState({ variant }: TripsEmptyStateProps) {
  const { title, description } = content[variant];

  return (
    <Card>
      <CardContent className="items-center py-10 text-center">
        <div className="mb-2 rounded-full bg-muted p-4">
          <Compass
            aria-hidden="true"
            className="size-6 text-muted-foreground"
          />
        </div>

        <h2 className="text-lg font-semibold">{title}</h2>

        <p className="max-w-md text-muted-foreground">
          {description}
        </p>

        {variant === "no-results" && (
          <Link
            href="/viagens"
            className="mt-2 rounded-sm text-sm font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Limpar filtros
          </Link>
        )}
      </CardContent>
    </Card>
  );
}