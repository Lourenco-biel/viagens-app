import type { ReactNode } from "react";
import { budgetCents, compareBudget, formatBRL } from "../lib/trip-costs";

export function TripCostSummary({
  budget,
  total,
  actions,
}: {
  budget: string | null;
  total: bigint;
  actions?: ReactNode;
}) {
  const comparison = compareBudget(budget, total);
  return (
    <section aria-label="Resumo de custos" className="min-w-0 space-y-4 rounded-xl bg-muted p-4">
      <div>
        <h3 className="font-semibold">Resumo de custos</h3>
        <p className="text-sm text-muted-foreground">Estimativas por pessoa · somente passeios</p>
      </div>
      <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-sm text-muted-foreground">Orçamento por pessoa</dt>
          <dd data-testid="budget-value" className="font-semibold [overflow-wrap:anywhere]">
            {budget === null ? "Orçamento ainda não definido" : formatBRL(budgetCents(budget))}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm text-muted-foreground">Passeios confirmados · por pessoa</dt>
          <dd data-testid="confirmed-total" className="font-semibold [overflow-wrap:anywhere]">
            {formatBRL(total)}
          </dd>
        </div>
      </dl>
      {comparison.state !== "undefined" && (
        <p
          data-testid="budget-comparison"
          role={comparison.state === "exceeded" ? "alert" : "status"}
          className={`font-medium [overflow-wrap:anywhere] ${comparison.state === "exceeded" ? "text-destructive" : ""}`}
        >
          {comparison.state === "reached"
            ? "Limite atingido"
            : "difference" in comparison
              ? `${formatBRL(comparison.difference)} ${comparison.state === "remaining" ? "restantes" : "excedidos"}`
              : ""}
        </p>
      )}
      {actions && <div className="flex flex-wrap items-start gap-2">{actions}</div>}
    </section>
  );
}
