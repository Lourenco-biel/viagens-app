import type { Activity } from "../model/activity";

export function budgetCents(value: string): bigint {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}

export function confirmedCost(
  activities: readonly Pick<Activity, "status" | "estimatedCost">[],
): bigint {
  return activities.reduce(
    (total, activity) =>
      activity.status === "confirmed"
        ? total + BigInt(Math.round(activity.estimatedCost * 100))
        : total,
    BigInt(0),
  );
}

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export type BudgetComparison =
  { state: "undefined" | "reached" } | { state: "remaining" | "exceeded"; difference: bigint };

export function compareBudget(budget: string | null, total: bigint): BudgetComparison {
  if (budget === null) return { state: "undefined" };
  const difference = budgetCents(budget) - total;
  if (difference === BigInt(0)) return { state: "reached" };
  return difference > BigInt(0)
    ? { state: "remaining", difference }
    : { state: "exceeded", difference: -difference };
}

export function formatBRL(cents: bigint): string {
  return money
    .formatToParts(cents / BigInt(100))
    .map((part) =>
      part.type === "fraction" ? (cents % BigInt(100)).toString().padStart(2, "0") : part.value,
    )
    .join("");
}
