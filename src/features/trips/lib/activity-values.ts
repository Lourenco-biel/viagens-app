import type { ActivityInput } from "../model/activity";

export function sameActivityValues(a: ActivityInput, b: ActivityInput) {
  return (
    a.title.trim() === b.title.trim() &&
    a.day === b.day &&
    a.startTime === b.startTime &&
    a.location.trim() === b.location.trim() &&
    a.estimatedCost === b.estimatedCost
  );
}
