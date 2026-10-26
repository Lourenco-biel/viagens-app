import { test, expect, mockApi, tripId } from "./support/fixtures";

test("valida, revisa, salva e reabre a viagem", async ({ page }) => {
  await mockApi(page, []);
  await page.goto("/viagens");
  await page.getByRole("link", { name: "Nova viagem", exact: true }).click();
  const form = page.getByRole("form", { name: "Nova viagem", exact: true });
  await form.getByLabel("Nome da viagem").fill("Passeio em família");
  await form.getByLabel("Destino", { exact: true }).fill("Curitiba, PR");
  await form.getByLabel("Data de início").fill("2026-12-10");
  await form.getByLabel("Data de término").fill("2026-12-09");
  await form.getByRole("button", { name: "Revisar viagem" }).click();
  await expect(form.getByRole("alert")).toHaveText(
    "A data de término deve ser igual ou posterior ao início.",
  );
  await form.getByLabel("Data de término").fill("2026-12-12");
  await form.getByRole("button", { name: "Revisar viagem" }).click();
  await page.getByRole("button", { name: "Salvar viagem", exact: true }).click();
  await expect(page).toHaveURL("/viagens/" + tripId);
  await expect(
    page.getByRole("heading", { name: "Passeio em família", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Passeio em família", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Editar viagem" }).click();
  await page.getByLabel("Nome da viagem").fill("Viagem atualizada");
  await page.getByRole("button", { name: "Revisar viagem" }).click();
  await page.getByRole("button", { name: "Salvar viagem" }).click();
  await expect(page.getByRole("heading", { name: "Viagem atualizada", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Excluir viagem" }).click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Suas próximas histórias começam aqui" }),
  ).toBeVisible();
});
