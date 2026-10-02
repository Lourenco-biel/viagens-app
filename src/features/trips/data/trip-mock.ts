import type { TripSummary } from "../model/trip";

export const mockTrips: readonly TripSummary[] = [
  {
    id: "florianopolis-2026",
    name: "Praias e trilhas com os amigos",
    destination: "Florianópolis, SC",
    startDate: "2026-10-16",
    endDate: "2026-10-22",
    participantCount: 4,
    status: "upcoming",
  },
  {
    id: "sao-paulo-2026",
    name: "Uma semana descobrindo São Paulo",
    destination: "São Paulo, SP",
    startDate: "2026-09-28",
    endDate: "2026-10-02",
    participantCount: 1,
    status: "ongoing",
  },
  {
    id: "rio-2026",
    name: "Feriado no Rio",
    destination: "Rio de Janeiro, RJ",
    startDate: "2026-05-08",
    endDate: "2026-05-12",
    participantCount: 3,
    status: "completed",
  },
];