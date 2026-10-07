import { expect, test } from "@playwright/test";

test("busca viagens pelo destino sem exigir acentos ou mesma caixa", async ({
  page,
}) => {
  await page.goto("/viagens");

  await expect(page.getByRole("article")).toHaveCount(3);

  await page
    .getByRole("searchbox", { name: "Buscar Viagem", exact: true })
    .fill("SAO PAULO");

  await page
    .getByRole("button", { name: "Buscar", exact: true })
    .click();

  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/viagens" &&
      url.searchParams.get("q") === "SAO PAULO",
  );

  await expect(page.getByRole("article")).toHaveCount(1);

  await expect(
    page.getByRole("article", {
      name: "Uma semana descobrindo São Paulo",
      exact: true,
    }),
  ).toBeVisible();
});

test("permite limpar uma busca sem resultados e voltar a ver as viagens", async ({
  page,
}) => {
  await page.goto("/viagens");

  await page
    .getByRole("searchbox", { name: "Buscar Viagem", exact: true })
    .fill("Destino inexistente");

  await page
    .getByRole("button", { name: "Buscar", exact: true })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "Nenhuma viagem encontrada",
      exact: true,
    }),
  ).toBeVisible();

  await expect(page.getByRole("article")).toHaveCount(0);

  await page
    .getByRole("link", { name: "Limpar filtros", exact: true })
    .click();

  await expect(page).toHaveURL(
    (url) => url.pathname === "/viagens" && url.search === "",
  );

  await expect(
    page.getByRole("searchbox", { name: "Buscar Viagem", exact: true }),
  ).toHaveValue("");

  await expect(page.getByRole("article")).toHaveCount(3);
});

test("preserva a busca ao trocar o status das viagens", async ({ page }) => {
  await page.goto("/viagens");

  await page
    .getByRole("searchbox", { name: "Buscar Viagem", exact: true })
    .fill("rio");

  await page
    .getByRole("button", { name: "Buscar", exact: true })
    .click();

  await expect(
    page.getByRole("article", { name: "Feriado no Rio", exact: true }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: "Próximas", exact: true })
    .click();

  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/viagens" &&
      url.searchParams.get("q") === "rio" &&
      url.searchParams.get("status") === "upcoming",
  );

  await expect(
    page.getByRole("searchbox", { name: "Buscar Viagem", exact: true }),
  ).toHaveValue("rio");

  await expect(
    page.getByRole("link", { name: "Próximas", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  await expect(
    page.getByRole("heading", {
      name: "Nenhuma viagem encontrada",
      exact: true,
    }),
  ).toBeVisible();

  await expect(page.getByRole("article")).toHaveCount(0);
});