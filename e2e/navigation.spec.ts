import { test, expect, mockApi, initialTrip, tripId } from "./support/fixtures";

test("card inteiro é um link com chamada de entrada e navegação por teclado", async ({
  page,
}, testInfo) => {
  await mockApi(page);
  await page.goto("/viagens");
  const card = page.getByRole("article").first();
  const link = card.getByRole("link", { name: "Entrar na viagem: " + initialTrip.name });
  await expect(card.getByRole("link")).toHaveCount(1);
  await expect(link).toHaveCSS("cursor", "pointer");
  await expect(link.getByText("Entrar na viagem", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("cards.png"), fullPage: true });
  await link.click({ position: { x: 12, y: 12 } });
  await expect(page).toHaveURL("/viagens/" + tripId);
  await page.getByRole("link", { name: "Voltar para suas viagens" }).click();
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/viagens/" + tripId);
});

test("retorno funciona sem histórico nas páginas de detalhes, criação e edição", async ({
  page,
}, testInfo) => {
  await mockApi(page);
  for (const [path, label, destination] of [
    ["/viagens/" + tripId, "Voltar para suas viagens", "/viagens"],
    ["/viagens/nova", "Voltar para suas viagens", "/viagens"],
    ["/viagens/" + tripId + "/editar", "Voltar ao roteiro", "/viagens/" + tripId],
  ]) {
    await page.goto(path);
    const back = page.getByRole("link", { name: label, exact: true });
    await expect(back).toHaveAttribute("href", destination);
    await expect(back).toHaveCSS("height", "44px");
    await back.focus();
    await expect(back.getByText(label)).toHaveCSS("opacity", "1");
    await back.press("Enter");
    await expect(page).toHaveURL(destination);
  }
  await page.screenshot({ path: testInfo.outputPath("roteiro.png"), fullPage: true });
});

test("card permite abrir a viagem em outra aba", async ({ page, isMobile }) => {
  test.skip(isMobile, "Atalho de teclado de desktop");
  await mockApi(page);
  await page.goto("/viagens");
  const popupPromise = page.context().waitForEvent("page");
  await page
    .getByRole("link", { name: "Entrar na viagem: " + initialTrip.name })
    .click({ button: "middle" });
  const popup = await popupPromise;
  await popup.waitForURL("**/viagens/" + tripId);
  await popup.close();
  await expect(page).toHaveURL("/viagens");
});
