import { test, expect, mockApi, inviteToken, tripId } from "./support/fixtures";

test("convite abre em modal e todos os cancelamentos preservam a participação", async ({
  page,
}, testInfo) => {
  await mockApi(page);
  let accepts = 0;
  page.on("request", (request) => {
    if (
      request.url().endsWith("/api/graphql") &&
      request.postDataJSON()?.operationName === "AcceptInvite"
    )
      accepts++;
  });
  for (const action of ["cancel", "close", "escape", "outside"]) {
    await page.goto("/convites/" + inviteToken);
    const modal = page.getByRole("dialog", { name: "Vamos viajar juntos?" });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("button", { name: "Aceitar convite" })).toBeFocused();
    await expect(page.getByRole("region", { name: /Participantes/ })).toHaveCount(0);
    if (action === "cancel") {
      await page.screenshot({ path: testInfo.outputPath("convite.png"), fullPage: true });
      await modal.getByRole("button", { name: "Agora não" }).click();
    }
    if (action === "close") await modal.getByRole("button", { name: "Fechar convite" }).click();
    if (action === "escape") await page.keyboard.press("Escape");
    if (action === "outside")
      await page.locator('[data-slot="dialog-overlay"]').click({ position: { x: 5, y: 5 } });
    await expect(page).toHaveURL("/viagens");
    await expect(modal).toHaveCount(0);
  }
  expect(accepts).toBe(0);
  await page.goto("/convites/" + inviteToken);
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(accepts).toBe(0);
});

test("aceite bloqueia fechamento, recupera erro e permite repetir convite válido", async ({
  page,
}) => {
  await mockApi(page);
  let fail = true;
  let release!: () => void;
  const response = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/graphql", async (route) => {
    if (route.request().postDataJSON().operationName === "AcceptInvite" && fail) {
      await response;
      await route.abort();
    } else await route.fallback();
  });
  await page.goto("/convites/" + inviteToken);
  const modal = page.getByRole("dialog");
  await modal.getByRole("button", { name: "Aceitar convite" }).click();
  await expect(modal.getByRole("button", { name: "Entrando..." })).toBeDisabled();
  await expect(modal.getByRole("button", { name: "Agora não" })).toBeDisabled();
  await expect(modal.getByRole("button", { name: "Fechar convite" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.locator('[data-slot="dialog-overlay"]').click({ position: { x: 5, y: 5 } });
  await expect(modal).toBeVisible();
  release();
  await expect(modal.getByRole("alert")).toContainText("conexão");
  fail = false;
  await modal.getByRole("button", { name: "Aceitar convite" }).click();
  await expect(page).toHaveURL("/viagens/" + tripId);
  await page.goto("/convites/" + inviteToken);
  await page.getByRole("button", { name: "Aceitar convite" }).click();
  await expect(page).toHaveURL("/viagens/" + tripId);
  await expect(page.getByRole("heading", { name: "Participantes (1)" })).toBeVisible();
});
