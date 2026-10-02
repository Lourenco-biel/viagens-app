const formatter = new Intl.DateTimeFormat("pt-BR",{
  dateStyle: "medium",
  timeZone: "UTC",
})

export function formatTripDate(date: string): string {
  return formatter.format(new Date(`${date}T00:00:00Z`));
}