import { test, expect, mockApi, tripId } from "./support/fixtures";

test("modal prende foco, confirma descarte em todos os fechamentos e reconhece valores restaurados", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/viagens/" + tripId);
  const trigger = page.getByRole("button", { name: "Sugerir passeio", exact: true });
  await expect(page.getByRole("form")).toHaveCount(0);
  const modal = page.getByRole("dialog", { name: "Sugerir passeio", exact: true });
  for (const action of ["cancel", "close", "escape", "outside"]) {
    await trigger.click();
    const title = modal.getByLabel("Nome do passeio");
    await expect(title).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(modal.getByRole("button", { name: "Fechar", exact: true })).toBeFocused();
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      await expect
        .poll(() => modal.evaluate((element) => element.contains(document.activeElement)))
        .toBe(true);
    }
    await modal.getByRole("button", { name: "Cancelar", exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(modal.getByRole("button", { name: "Fechar", exact: true })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(modal.getByRole("button", { name: "Cancelar", exact: true })).toBeFocused();
    await title.fill("Meu rascunho");
    async function close() {
      if (action === "cancel")
        await modal.getByRole("button", { name: "Cancelar", exact: true }).click();
      if (action === "close")
        await modal.getByRole("button", { name: "Fechar", exact: true }).click();
      if (action === "escape") await page.keyboard.press("Escape");
      if (action === "outside")
        await page.locator('[data-slot="dialog-overlay"]').click({ position: { x: 5, y: 5 } });
    }
    page.once("dialog", (dialog) => dialog.dismiss());
    await close();
    await expect(title).toHaveValue("Meu rascunho");
    page.once("dialog", (dialog) => dialog.accept());
    await close();
    await expect(modal).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
  await trigger.click();
  await modal.getByLabel("Nome do passeio").fill("Texto temporário");
  await modal.getByLabel("Nome do passeio").fill("");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
});

test("envio bloqueia fechamento e duplicação e devolve foco depois de salvar", async ({ page }) => {
  await mockApi(page);
  let release!: () => void;
  const response = new Promise<void>((resolve) => {
    release = resolve;
  });
  let saves = 0;
  await page.route("**/api/graphql", async (route) => {
    if (route.request().postDataJSON().operationName === "AddActivity") {
      saves++;
      await response;
    }
    await route.fallback();
  });
  await page.goto("/viagens/" + tripId);
  const trigger = page.getByRole("button", { name: "Sugerir passeio" });
  await trigger.click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel("Nome do passeio").fill("Passeio novo");
  await modal.getByRole("button", { name: "Adicionar sugestão" }).click();
  await expect(modal.getByRole("button", { name: "Salvando..." })).toBeDisabled();
  await expect(modal.getByRole("button", { name: "Fechar", exact: true })).toBeDisabled();
  await expect(modal.getByRole("button", { name: "Cancelar", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.locator('[data-slot="dialog-overlay"]').click({ position: { x: 5, y: 5 } });
  await expect(modal).toBeVisible();
  release();
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("status")).toHaveText("Passeio adicionado às sugestões.");
  expect(saves).toBe(1);
});

test("modal mantém campos e ações acessíveis em viewport baixo", async ({ page }, testInfo) => {
  await mockApi(page);
  await page.goto("/viagens/" + tripId);
  await page.getByRole("button", { name: "Sugerir passeio" }).click();
  const modal = page.getByRole("dialog");
  await page.screenshot({ path: testInfo.outputPath("modal.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 400 });
  await expect(modal).toHaveCSS("max-height", "368px");
  await modal.getByLabel("Nome do passeio").fill("Passeio no celular");
  const save = modal.getByRole("button", { name: "Adicionar sugestão" });
  expect(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await save.click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Passeio no celular" })).toBeVisible();
});
