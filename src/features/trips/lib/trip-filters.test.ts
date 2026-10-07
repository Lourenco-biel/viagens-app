import { describe, expect, it } from "@jest/globals";

import type { TripSummary } from "../model/trip";
import { filterTrips, parseTripFilters } from "./trip-filters";

describe("parseTripFilters", () => {
  it("remove espaços nas extremidades da busca e mantém um status válido", () => {
    const searchParams = {
      q: "  São Paulo  ",
      status: "upcoming",
    };

    const result = parseTripFilters(searchParams);

    expect(result).toEqual({
      query: "São Paulo",
      status: "upcoming",
    });
  });

  it("retonar os filtros padrão quando não há parâmetros", () => {
    const result = parseTripFilters({});

    expect(result).toEqual({
      query: "",
      status: "all",
    });
  });

  it("usa todos os status quando recebe um status invalido", () => {
    const result = parseTripFilters({
      q: "praia",
      status: "invalid",
    });

    expect(result).toEqual({
      query: "praia",
      status: "all",
    });
  });
});

describe("filterTrips", () => {
  it("encontra o destino independentemente de acentos e maiúsculas", () => {
    const trips: readonly TripSummary[] = [
      {
        id: "trip-sao-paulo",
        name: "Fim de semana",
        destination: "São Paulo, SP",
        startDate: "2026-11-10",
        endDate: "2026-11-12",
        participantCount: 2,
        status: "upcoming",
      },
      {
        id: "trip-curitiba",
        name: "Passeio em família",
        destination: "Curitiba, PR",
        startDate: "2026-12-01",
        endDate: "2026-12-05",
        participantCount: 3,
        status: "upcoming",
      },
    ];

    const result = filterTrips(trips, {
      query: "SAO PAULO",
      status: "all",
    });

    expect(result.map((trip) => trip.id)).toEqual(["trip-sao-paulo"]);
  });

  it("retorna apenas viagens que correspondem à busca e ao status", () => {
    const trips: readonly TripSummary[] = [
      {
        id: "rio-upcoming",
        name: "Próximas férias",
        destination: "Rio de Janeiro, RJ",
        startDate: "2026-12-10",
        endDate: "2026-12-15",
        participantCount: 2,
        status: "upcoming",
      },
      {
        id: "rio-completed",
        name: "Férias anteriores",
        destination: "Rio de Janeiro, RJ",
        startDate: "2026-05-10",
        endDate: "2026-05-15",
        participantCount: 2,
        status: "completed",
      },
      {
        id: "curitiba-upcoming",
        name: "Passeio em família",
        destination: "Curitiba, PR",
        startDate: "2026-12-20",
        endDate: "2026-12-25",
        participantCount: 3,
        status: "upcoming",
      },
    ];

    const result = filterTrips(trips, {
      query: "rio",
      status: "upcoming",
    });

    expect(result.map((trip) => trip.id)).toEqual(["rio-upcoming"]);
  });

  it("retorna uma lista vazia quando nenhuma viagem corresponde a busca", () => {
    const trips: readonly TripSummary[] = [
      {
        id: "trip-curitiba",
        name: "Passeio em família",
        destination: "Curitiba, PR",
        startDate: "2026-12-01",
        endDate: "2026-12-05",
        participantCount: 3,
        status: "upcoming",
      },
    ];

    const result = filterTrips(trips, {
      query: "salvador",
      status: "all",
    });

    expect(result).toEqual([]);
  });
});
