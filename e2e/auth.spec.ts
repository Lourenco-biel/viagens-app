import { test, expect } from "@playwright/test";
import { mockApi, inviteToken } from "./support/fixtures";

test("protege páginas e mantém o destino do convite após login", async ({ page }) => {
  await mockApi(page);
  await page.goto("/convites/" + inviteToken);
  await expect(page).toHaveURL(/\/entrar\?next=/);
  await page.getByLabel("E-mail", { exact: true }).fill("study@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("/convites/" + inviteToken);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL("/entrar");
  await page.goto("/viagens");
  await expect(page).toHaveURL(/\/entrar/);
});

test("rejeita credenciais inválidas sem expor detalhes", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill("study@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("wrongpass");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("form", { name: "Entrar", exact: true }).getByRole("alert"),
  ).toContainText("E-mail ou senha inválidos");
});

test("API não permite consulta anônima nem origem externa", async ({ request }) => {
  const response = await request.post("/api/graphql", { data: { query: "{ viewerId }" } });
  expect(response.status()).toBe(401);
  const external = await request.post("/api/graphql", {
    headers: { origin: "https://example.test" },
    data: { query: "{ viewerId }" },
  });
  expect(external.status()).toBe(403);
});
