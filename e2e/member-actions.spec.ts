import { test, expect, mockApi, initialTrip, tripId } from "./support/fixtures";
import { user } from "./support/session.mjs";

const guest = {
  userId: "22222222-2222-4222-8222-222222222222",
  displayName: "Ana",
  isOwner: false,
};
const second = { ...guest, userId: "33333333-3333-4333-8333-333333333333" };
const trip = {
  ...initialTrip,
  participantCount: 3,
  members: [...initialTrip.members, guest, second],
  activities: [
    {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      title: "Museu",
      day: "2026-12-11",
      startTime: null,
      location: "",
      estimatedCost: 0,
      status: "proposed" as const,
      createdBy: second.userId,
      votes: 1,
      votedByMe: false,
      version: 1,
    },
  ],
};

test("menu remove pelo identificador, mantém sugestões e confirma antes de excluir", async ({
  page,
}, testInfo) => {
  await mockApi(page, [trip]);
  let selected = "";
  const updated = structuredClone(trip);
  await page.route("**/api/graphql", async (route) => {
    const { operationName, variables } = route.request().postDataJSON();
    if (operationName === "RemoveMember") {
      selected = variables.userId;
      updated.members = updated.members.filter((m) => m.userId !== selected);
      updated.participantCount = updated.members.length;
      updated.activities[0].votes = 0;
      await route.fulfill({ json: { data: { removeMember: true } } });
    } else if (operationName === "Trip" && selected) {
      await route.fulfill({
        json: {
          data: {
            trip: {
              ...updated,
              __typename: "Trip",
              members: updated.members.map((member) => ({ ...member, __typename: "Member" })),
              activities: updated.activities.map((activity) => ({
                ...activity,
                __typename: "Activity",
              })),
            },
            viewerId: user.id,
          },
        },
      });
    } else await route.fallback();
  });
  await page.goto("/viagens/" + tripId);
  const members = page.getByRole("region", { name: /Participantes/ });
  await expect(members.getByRole("button", { name: /Ações de/ })).toHaveCount(2);
  await expect(members.getByRole("button", { name: "Remover participante" })).toHaveCount(0);
  const trigger = members.getByRole("button", { name: "Ações de Ana", exact: true }).nth(1);
  await trigger.focus();
  await page.keyboard.press("Enter");
  const item = page.getByRole("menuitem", { name: "Remover participante" });
  await expect(item).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.screenshot({ path: testInfo.outputPath("menu-participante.png"), animations: "disabled" });
  await item.click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByRole("button", { name: "Cancelar", exact: true })).toBeFocused();
  await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(trigger).toBeFocused();
  expect(selected).toBe("");
  await trigger.click();
  await item.click();
  await page.screenshot({ path: testInfo.outputPath("remover-participante.png"), animations: "disabled" });
  await dialog.getByRole("button", { name: "Remover participante" }).click();
  await expect(dialog).toHaveCount(0);
  expect(selected).toBe(second.userId);
  await expect(members.getByRole("heading")).toHaveText("Participantes (2)");
  await expect(members.getByRole("heading")).toBeFocused();
  await expect(members.getByRole("status")).toHaveText("Participante removido.");
  await expect(page.getByRole("heading", { name: "Museu", exact: true })).toBeVisible();
  await expect(page.getByText("0 votos", { exact: true })).toBeVisible();
});

test("atualização da lista preserva o alvo e devolve foco ao título se a linha desaparecer", async ({
  page,
}) => {
  await page.clock.install();
  await mockApi(page, [trip]);
  await page.goto("/viagens/" + tripId);
  await page.getByRole("button", { name: "Ações de Ana", exact: true }).last().click();
  await page.getByRole("menuitem", { name: "Remover participante" }).click();
  await mockApi(page, [{ ...trip, participantCount: 1, members: initialTrip.members }]);
  const refresh = page.waitForResponse(
    (response) =>
      response.url().includes("/api/graphql") &&
      response.request().postDataJSON().operationName === "Trip",
  );
  await page.clock.fastForward(31000);
  await refresh;
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByRole("heading")).toHaveText("Remover Ana da viagem?");
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("heading", { name: "Participantes (1)" })).toBeFocused();
});

test("remoção mantém confirmação em erro e bloqueia repetição durante envio", async ({ page }) => {
  await mockApi(page, [trip]);
  let release!: () => void;
  const response = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  await page.route("**/api/graphql", async (route) => {
    if (route.request().postDataJSON().operationName === "RemoveMember") {
      calls++;
      await response;
      await route.abort();
    } else await route.fallback();
  });
  await page.goto("/viagens/" + tripId);
  await page.getByRole("button", { name: "Ações de Ana", exact: true }).first().click();
  await page.getByRole("menuitem", { name: "Remover participante" }).click();
  const dialog = page.getByRole("alertdialog");
  await dialog.getByRole("button", { name: "Remover participante" }).click();
  await expect(dialog.getByRole("button", { name: "Removendo..." })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  release();
  await expect(dialog.getByRole("alert")).toContainText("conexão");
  expect(calls).toBe(1);
  await expect(dialog.getByRole("button", { name: "Remover participante" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("heading", { name: "Participantes (3)" })).toBeVisible();
});

test("participante comum não tem menus e nomes longos cabem na linha", async ({ page }) => {
  await mockApi(page, [
    {
      ...trip,
      isOwner: false,
      members: [
        { ...initialTrip.members[0], isOwner: false },
        { ...guest, isOwner: true },
      ],
    },
  ]);
  await page.goto("/viagens/" + tripId);
  await expect(page.getByRole("heading", { name: /Participantes/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Ações de/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sair da viagem" })).toBeVisible();
  await mockApi(page, [
    {
      ...trip,
      members: [
        ...initialTrip.members,
        {
          ...guest,
          displayName: "Nome de participante muito comprido para verificar a quebra de linha",
        },
      ],
    },
  ]);
  await page.reload();
  const actions = page.getByRole("button", { name: /Ações de Nome/ });
  await expect(actions).toHaveCSS("width", "44px");
  expect(await page.locator("body").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
});
