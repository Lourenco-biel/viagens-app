import { expect, test } from "@playwright/test";

test("permite corrigir o período e revisar os dados da viagem", async ({
  page,
}) => {
  await page.goto("/viagens");

  await page
    .getByRole("link", { name: "Nova viagem", exact: true })
    .click();

  await expect(page).toHaveURL(/\/viagens\/nova$/);

  const form = page.getByRole("form", {
    name: "Nova viagem",
    exact: true,
  });

  const endDate = form.getByLabel("Data de término", { exact: true });
  const reviewButton = form.getByRole("button", {
    name: "Revisar viagem",
    exact: true,
  });

  const summary = page.getByRole("region", {
    name: "Resumo da viagem para revisão",
    exact: true,
  });

  await form.getByLabel("Nome da viagem").fill("Passeio em família");
  await form.getByLabel("Destino", { exact: true }).fill("Curitiba, PR");
  await form.getByLabel("Data de início").fill("2026-12-10");
  await endDate.fill("2026-12-09");

  await reviewButton.click();

  await expect(form.getByRole("alert")).toHaveText(
    "A data de término deve ser igual ou posterior ao início.",
  );
  await expect(endDate).toHaveAttribute("aria-invalid", "true");
  await expect(summary).toHaveCount(0);

  await endDate.fill("2026-12-12");
  await reviewButton.click();

  await expect(form.getByRole("alert")).toHaveCount(0);
  await expect(endDate).toHaveAttribute("aria-invalid", "false");
  await expect(summary).toBeVisible();

  await expect(
    summary.getByRole("heading", {
      name: "Passeio em família",
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    summary.getByText("Curitiba, PR", { exact: true }),
  ).toBeVisible();
});