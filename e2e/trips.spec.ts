import { test, expect, mockApi, initialTrip, tripId, inviteToken } from "./support/fixtures";

test("busca e filtros permanecem na URL", async ({ page }) => {
  await mockApi(page, [{ ...initialTrip, destination: "São Paulo, SP" }]);
  await page.goto("/viagens");
  await page.getByRole("searchbox").fill("sao paulo");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page).toHaveURL(/q=sao\+paulo/);
  await expect(page.getByRole("status")).toHaveText("1 viagem encontrada");
  await page.getByRole("link", { name: "Concluídas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nenhuma viagem encontrada" })).toBeVisible();
  await page.getByRole("link", { name: "Limpar filtros" }).click();
  await expect(page.getByRole("link", { name: initialTrip.name, exact: true })).toBeVisible();
});

test("sugere, vota e confirma um passeio", async ({ page }, testInfo) => {
  await mockApi(page);
  await page.goto("/viagens/" + tripId);
  const form = page.getByRole("form", { name: "Sugerir passeio" });
  await form.getByLabel("Nome do passeio").fill("Jardim Botânico");
  await form.getByLabel("Dia", { exact: true }).fill("2026-12-11");
  await form.getByLabel("Custo estimado por pessoa").fill("25.50");
  await form.getByRole("button", { name: "Adicionar sugestão" }).click();
  const activity = page.getByRole("article").filter({ hasText: "Jardim Botânico" });
  await activity.getByRole("button", { name: "Votar", exact: true }).click();
  await expect(activity.getByText("1 voto", { exact: true })).toBeVisible();
  await activity.getByRole("button", { name: "Retirar voto" }).click();
  await expect(activity.getByText("0 votos", { exact: true })).toBeVisible();
  await activity.getByRole("button", { name: "Confirmar passeio" }).click();
  await expect(activity.getByText("Confirmado", { exact: true })).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    await page.locator("body").evaluate((el) => el.clientWidth),
  );
  await page.screenshot({ path: testInfo.outputPath("roteiro.png"), fullPage: true });
  await expect(activity.getByRole("button", { name: "Votar", exact: true })).toHaveCount(0);
  await activity.getByRole("button", { name: "Reabrir votação" }).click();
  await expect(activity.getByRole("button", { name: "Votar", exact: true })).toBeVisible();
  await activity.getByRole("button", { name: "Remover passeio" }).click();
  await activity.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(activity).toHaveCount(0);
});

test("gera convite e aceita participação", async ({ page }) => {
  await mockApi(page);
  await page.goto("/viagens/" + tripId);
  await page.getByRole("button", { name: "Convidar pessoas" }).click();
  await expect(page.getByLabel("Link do convite")).toHaveValue(
    "http://localhost:3100/convites/" + inviteToken,
  );
  await page.goto("/convites/" + inviteToken);
  await page.getByRole("button", { name: "Aceitar convite" }).click();
  await expect(page).toHaveURL("/viagens/" + tripId);
});

test("mostra convite expirado e permite voltar", async ({ page }) => {
  await mockApi(page);
  await page.goto("/convites/dddddddd-dddd-4ddd-8ddd-dddddddddddd");
  await page.getByRole("button", { name: "Aceitar convite" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Convite inválido ou expirado.",
  );
  await page.getByRole("link", { name: "Voltar às viagens" }).click();
  await expect(page).toHaveURL("/viagens");
});

test("participante não vê controles exclusivos do organizador", async ({ page }) => {
  await mockApi(page, [{ ...initialTrip, isOwner: false }]);
  await page.goto("/viagens/" + tripId);
  await expect(page.getByRole("heading", { name: initialTrip.name, exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Editar viagem" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Convidar pessoas" })).toHaveCount(0);
});

test("falha de rede mostra recuperação", async ({ page }) => {
  await page.route("**/api/graphql", (route) => route.abort());
  await page.goto("/viagens");
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await mockApi(page);
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("link", { name: initialTrip.name, exact: true })).toBeVisible();
});
