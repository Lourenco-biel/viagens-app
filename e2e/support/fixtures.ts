import { expect, test as base, type Page } from "@playwright/test";
import { session, user } from "./session.mjs";
import type { TripDetail } from "../../src/features/trips/model/trip-detail";

export const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const inviteToken = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const initialTrip: TripDetail = {
  id: tripId,
  name: "Férias em Curitiba",
  destination: "Curitiba, PR",
  startDate: "2026-12-10",
  endDate: "2026-12-12",
  participantCount: 1,
  status: "upcoming",
  isOwner: true,
  members: [{ userId: user.id, displayName: "Gabriel", isOwner: true }],
  activities: [],
};

export async function mockApi(page: Page, initial: TripDetail[] = [structuredClone(initialTrip)]) {
  let trips = structuredClone(initial);
  await page.route("**/api/graphql", async (route) => {
    const { operationName, variables: v } = route.request().postDataJSON();
    const trip = trips.find((t) => t.id === (v.id ?? v.tripId)) ?? trips[0];
    let data: Record<string, unknown> = {};
    switch (operationName) {
      case "Trips": {
        const normalize = (text: string) =>
          text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
        const found = trips.filter(
          (t) =>
            (v.filters.status === "all" || t.status === v.filters.status) &&
            normalize(t.name + " " + t.destination).includes(normalize(v.filters.query)),
        );
        data = {
          trips: {
            items: found.slice(v.filters.offset, v.filters.offset + v.filters.limit),
            total: found.length,
            hasTrips: trips.length > 0,
          },
        };
        break;
      }
      case "Trip":
        data = { trip, viewerId: user.id };
        break;
      case "CreateTrip": {
        const created = { ...structuredClone(initialTrip), ...v.input };
        trips.push(created);
        data = { createTrip: created };
        break;
      }
      case "UpdateTrip":
        Object.assign(trip, v.input);
        data = { updateTrip: trip };
        break;
      case "DeleteTrip":
        trips = trips.filter((t) => t.id !== v.id);
        data = { deleteTrip: true };
        break;
      case "AddActivity":
        trip.activities.push({
          ...v.input,
          id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          status: "proposed",
          createdBy: user.id,
          votes: 0,
          votedByMe: false,
          version: 1,
        });
        data = { addActivity: trip };
        break;
      case "VoteActivity": {
        const activity = trip.activities.find((a) => a.id === v.id)!;
        activity.votes = v.voted ? 1 : 0;
        activity.votedByMe = v.voted;
        data = { voteActivity: trip };
        break;
      }
      case "SetActivityStatus":
        trip.activities.find((a) => a.id === v.id)!.version += 1;
        trip.activities.find((a) => a.id === v.id)!.status = v.confirmed ? "confirmed" : "proposed";
        data = { setActivityStatus: trip };
        break;
      case "UpdateActivity": {
        const activity = trip.activities.find((a) => a.id === v.id)!;
        if (activity.version !== v.expectedVersion) {
          await route.fulfill({
            json: {
              errors: [
                {
                  message: "Este passeio mudou. Carregue a versão atual antes de salvar.",
                  extensions: { code: "CONFLICT" },
                },
              ],
            },
          });
          return;
        }
        const changed = Object.entries(v.input).some(
          ([key, value]) => activity[key as keyof typeof activity] !== value,
        );
        if (changed)
          Object.assign(activity, v.input, {
            version: activity.version + 1,
            votes: 0,
            votedByMe: false,
            status: "proposed",
          });
        data = { updateActivity: trip };
        break;
      }
      case "DeleteActivity":
        trip.activities = trip.activities.filter((a) => a.id !== v.id);
        data = { deleteActivity: trip };
        break;
      case "CreateInvite":
        data = { createInvite: { token: inviteToken, expiresAt: "2026-12-01T00:00:00Z" } };
        break;
      case "AcceptInvite":
        if (v.token !== inviteToken) {
          await route.fulfill({
            json: {
              errors: [
                {
                  message: "Convite inválido ou expirado.",
                  extensions: { code: "BAD_USER_INPUT" },
                },
              ],
            },
          });
          return;
        }
        data = { acceptInvite: trip };
        break;
      default:
        throw new Error("Operação sem fixture: " + operationName);
    }
    const addTypes = (value: unknown, key = ""): unknown => {
      if (Array.isArray(value)) return value.map((item) => addTypes(item, key));
      if (!value || typeof value !== "object") return value;
      const record = value as Record<string, unknown>;
      const result = Object.fromEntries(
        Object.entries(record).map(([k, v]) => [k, addTypes(v, k)]),
      );
      if ("destination" in record) return { ...result, __typename: "Trip" };
      if ("votedByMe" in record) return { ...result, __typename: "Activity" };
      if ("displayName" in record) return { ...result, __typename: "Member" };
      if (key === "trips") return { ...result, __typename: "TripPage" };
      return result;
    };
    await route.fulfill({ json: { data: addTypes(data) } });
  });
}

export const test = base.extend<{ signedIn: void }>({
  signedIn: [
    async ({ context }, use) => {
      await context.addCookies([
        {
          name: "sb-127-auth-token",
          value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"),
          domain: "localhost",
          path: "/",
        },
      ]);
      await use();
    },
    { auto: true },
  ],
});
export { expect };
