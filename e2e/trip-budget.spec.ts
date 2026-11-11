import { test, expect, mockApi, initialTrip, tripId } from "./support/fixtures";
import type { Activity } from "../src/features/trips/model/activity";

function activity(cost: number, status: Activity["status"] = "confirmed", id = "museum"): Activity {
  return {
    id,
    title: "Museu",
    day: "2026-12-11",
    startTime: null,
    location: "",
    estimatedCost: cost,
    status,
    createdBy: initialTrip.members[0].userId,
    version: 1,
    votes: 2,
    votedByMe: false,
  };
}

test("organizador define, edita, salva zero e remove sem perder passeios", async ({ page }) => {
  const api = await mockApi(page, [{ ...initialTrip, activities: [activity(320)] }]);
  const originalActivities = structuredClone(api.trips[0].activities);
  await page.goto("/viagens/" + tripId);
  const summary = page.getByRole("region", { name: "Resumo de custos" });
  await expect(summary).toContainText("Orçamento ainda não definido");
  for (const [value, formatted] of [
    ["500", "500,00"],
    ["600,50", "600,50"],
    ["0", "0,00"],
  ]) {
    await summary.getByRole("button", { name: /Definir orçamento|Editar orçamento/ }).click();
    const modal = page.getByRole("dialog");
    await modal.getByLabel("Orçamento estimado por pessoa (R$)").fill(value);
    await modal.getByRole("button", { name: "Salvar orçamento" }).click();
    await expect(modal).toHaveCount(0);
    await expect(summary.getByTestId("budget-value")).toContainText(formatted);
    await page.reload();
    await expect(summary.getByTestId("budget-value")).toContainText(formatted);
  }
  await summary.getByRole("button", { name: "Remover orçamento" }).click();
  await summary.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(summary.getByTestId("budget-value")).toContainText("0,00");
  await summary.getByRole("button", { name: "Remover orçamento" }).click();
  await summary.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(summary).toContainText("Orçamento ainda não definido");
  await page.reload();
  await expect(summary).toContainText("Orçamento ainda não definido");
  expect(api.trips[0].activities).toEqual(originalActivities);
});
test("participante consulta orçamento sem controles", async ({ page }) => {
  await mockApi(page, [{ ...initialTrip, budgetPerPerson: "500.00", isOwner: false }]);
  await page.goto("/viagens/" + tripId);
  const summary = page.getByRole("region", { name: "Resumo de custos" });
  await expect(summary.getByTestId("budget-value")).toContainText("500,00");
  await expect(summary.getByRole("button")).toHaveCount(0);
});

for (const [budget, total, result] of [
  [null, 320, null],
  ["500.00", 320, "R$ 180,00 restantes"],
  ["500.00", 550, "R$ 50,00 excedidos"],
  ["500.00", 500, "Limite atingido"],
  ["0.00", 0, "Limite atingido"],
  ["0.00", 20, "R$ 20,00 excedidos"],
  ["500.00", 0, "R$ 500,00 restantes"],
] as const) {
  test(`comparação ${budget}/${total}`, async ({ page }) => {
    await mockApi(page, [
      {
        ...initialTrip,
        participantCount: 5,
        budgetPerPerson: budget,
        activities: [activity(total), activity(999, "proposed", "suggestion")],
      },
    ]);
    await page.goto("/viagens/" + tripId);
    const summary = page.getByRole("region", { name: "Resumo de custos" });
    await expect(summary.getByTestId("confirmed-total")).toContainText(`${total},00`);
    if (result) await expect(summary.getByTestId("budget-comparison")).toHaveText(result);
    else await expect(summary.getByTestId("budget-comparison")).toHaveCount(0);
  });
}
test("centavos exatos e atualização de orçamento, custos e participantes pelo polling existente", async ({
  page,
}) => {
  await page.clock.install();
  const api = await mockApi(page, [
    {
      ...initialTrip,
      budgetPerPerson: "0.30",
      activities: [activity(0.1), activity(0.2, "confirmed", "second")],
    },
  ]);
  await page.goto("/viagens/" + tripId);
  const summary = page.getByRole("region", { name: "Resumo de custos" });
  await expect(summary).toContainText("Limite atingido");
  api.trips[0].budgetPerPerson = "500.00";
  api.trips[0].activities = [activity(320), activity(999, "proposed", "second")];
  api.trips[0] = { ...api.trips[0], participantCount: 8 };
  await page.clock.fastForward(30000);
  await expect(summary.getByTestId("budget-comparison")).toHaveText("R$ 180,00 restantes");
});
test("roteiro atualiza comparação e permanece livre acima do limite", async ({ page }) => {
  await mockApi(page, [
    { ...initialTrip, budgetPerPerson: "0.00", activities: [activity(20, "proposed")] },
  ]);
  await page.goto("/viagens/" + tripId);
  const comparison = page.getByTestId("budget-comparison");
  const museum = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Museu", exact: true }) });
  await museum.getByRole("button", { name: "Confirmar passeio" }).click();
  await expect(comparison).toHaveText("R$ 20,00 excedidos");
  await page.getByRole("button", { name: "Sugerir passeio" }).click();
  await page.getByLabel("Nome do passeio").fill("Parque");
  await page.getByRole("button", { name: "Adicionar sugestão" }).click();
  const park = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Parque" }) });
  await park.getByRole("button", { name: "Votar", exact: true }).click();
  await expect(park.getByRole("button", { name: "Retirar voto" })).toBeVisible();
  await park.getByRole("button", { name: "Confirmar passeio" }).click();
  await expect(comparison).toHaveText("R$ 20,00 excedidos");
  await park.getByRole("button", { name: "Reabrir votação" }).click();
  await museum.getByRole("button", { name: "Reabrir votação" }).click();
  await expect(comparison).toHaveText("Limite atingido");
  await museum.getByRole("button", { name: "Confirmar passeio" }).click();
  for (const cost of ["20", "30"]) {
    await museum.getByRole("button", { name: "Editar passeio" }).click();
    const modal = page.getByRole("dialog");
    await modal.getByLabel(/Custo estimado/).fill(cost);
    if (cost === "30") page.once("dialog", (d) => d.accept());
    await modal.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(modal).toHaveCount(0);
    await expect(comparison).toHaveText(cost === "20" ? "R$ 20,00 excedidos" : "Limite atingido");
  }
  await museum.getByRole("button", { name: "Confirmar passeio" }).click();
  await expect(comparison).toHaveText("R$ 30,00 excedidos");
  await museum.getByRole("button", { name: "Remover passeio" }).click();
  await museum.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(comparison).toHaveText("Limite atingido");
});

test("validação recusa entradas inválidas e falha preserva preenchimento para nova tentativa", async ({
  page,
}) => {
  const api = await mockApi(page, [{ ...initialTrip, budgetPerPerson: "500.00" }]);
  let attempts = 0;
  await page.route("**/api/graphql", async (route) => {
    if (route.request().postDataJSON().operationName === "SetTripBudget" && ++attempts === 1) {
      await route.fulfill({
        json: {
          errors: [
            {
              message: "Não foi possível salvar o orçamento.",
              extensions: { code: "OPERATION_FAILED" },
            },
          ],
        },
      });
    } else await route.fallback();
  });
  await page.goto("/viagens/" + tripId);
  await page.getByRole("button", { name: "Editar orçamento" }).click();
  const modal = page.getByRole("dialog");
  const input = modal.getByLabel("Orçamento estimado por pessoa (R$)");
  await expect(input).toHaveValue("500,00");
  for (const value of ["", "-1", "1.001", "1.230", "1e2", "1.000,00", "abc"]) {
    await input.fill(value);
    await modal.getByRole("button", { name: "Salvar orçamento" }).click();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toBeFocused();
    await expect(modal.getByRole("alert")).toBeVisible();
  }
  expect(attempts).toBe(0);
  await input.fill(" 600,5 ");
  await modal.getByRole("button", { name: "Salvar orçamento" }).click();
  await expect(modal.getByRole("alert")).toContainText("Não foi possível salvar");
  await expect(input).toHaveValue(" 600,5 ");
  expect(api.trips[0].budgetPerPerson).toBe("500.00");
  await modal.getByRole("button", { name: "Salvar orçamento" }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByTestId("budget-value")).toContainText("600,50");
  expect(attempts).toBe(2);
});

test("teclado contém foco e cancelamento confirma descarte em cada forma de fechar", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/viagens/" + tripId);
  const trigger = page.getByRole("button", { name: "Definir orçamento" });
  const modal = page.getByRole("dialog");
  for (const action of ["cancel", "close", "escape", "outside"]) {
    await trigger.focus();
    await page.keyboard.press("Enter");
    const input = modal.getByLabel("Orçamento estimado por pessoa (R$)");
    await expect(input).toBeFocused();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press(i < 6 ? "Tab" : "Shift+Tab");
      await expect
        .poll(() => modal.evaluate((el) => el.contains(document.activeElement)))
        .toBe(true);
    }
    await input.fill("123");
    async function close() {
      if (action === "cancel")
        await modal.getByRole("button", { name: "Cancelar", exact: true }).click();
      if (action === "close")
        await modal.getByRole("button", { name: "Fechar", exact: true }).click();
      if (action === "escape") await page.keyboard.press("Escape");
      if (action === "outside")
        await page.locator('[data-slot="dialog-overlay"]').click({ position: { x: 5, y: 5 } });
    }
    page.once("dialog", (d) => d.dismiss());
    await close();
    await expect(input).toHaveValue("123");
    page.once("dialog", (d) => d.accept());
    await close();
    await expect(modal).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
});

test("envio lento bloqueia fechamento e envio duplicado", async ({ page }) => {
  await mockApi(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let saves = 0;
  await page.route("**/api/graphql", async (route) => {
    if (route.request().postDataJSON().operationName === "SetTripBudget") {
      saves++;
      await pending;
    }
    await route.fallback();
  });
  await page.goto("/viagens/" + tripId);
  await page.getByRole("button", { name: "Definir orçamento" }).focus();
  await page.keyboard.press("Enter");
  const modal = page.getByRole("dialog");
  await modal.getByLabel("Orçamento estimado por pessoa (R$)").fill("500.50");
  await page.keyboard.press("Tab");
  await expect(modal.getByRole("button", { name: "Salvar orçamento" })).toBeFocused();
  await page.keyboard.press("Enter");
  for (const name of ["Salvando...", "Cancelar", "Fechar"])
    await expect(modal.getByRole("button", { name, exact: true })).toBeDisabled();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await page.locator('[data-slot="dialog-overlay"]').click({ position: { x: 5, y: 5 } });
  await expect(modal).toBeVisible();
  expect(saves).toBe(1);
  release();
  await expect(modal).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Editar orçamento" })).toBeFocused();
  await expect(page.getByTestId("budget-value")).toContainText("500,50");
  await page.keyboard.press("Enter");
  await modal.getByLabel("Orçamento estimado por pessoa (R$)").fill("600,50");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(modal).toHaveCount(0);
  await expect(page.getByTestId("budget-value")).toContainText("600,50");
});

test("polling preserva rascunho e cancelamento revela o orçamento atualizado", async ({ page }) => {
  await page.clock.install();
  const api = await mockApi(page, [{ ...initialTrip, budgetPerPerson: "500.00" }]);
  await page.goto("/viagens/" + tripId);
  await page.getByRole("button", { name: "Editar orçamento" }).click();
  const input = page.getByLabel("Orçamento estimado por pessoa (R$)");
  await input.fill("999,50");
  api.trips[0].budgetPerPerson = "600.00";
  await page.clock.fastForward(30000);
  await expect(page.getByTestId("budget-value")).toContainText("600,00");
  await expect(input).toHaveValue("999,50");
  page.once("dialog", (d) => d.accept());
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByTestId("budget-value")).toContainText("600,00");
});

for (const failure of ["network", "http", "graphql"] as const) {
  test(`recuperação do rascunho após falha de salvamento e polling ${failure}`, async ({
    page,
  }) => {
    await page.clock.install();
    const api = await mockApi(page, [{ ...initialTrip, budgetPerPerson: "500.00" }]);
    let failReads = false;
    let readsFailed = 0;
    let saves = 0;
    await page.route("**/api/graphql", async (route) => {
      const { operationName } = route.request().postDataJSON();
      if (operationName === "SetTripBudget" && ++saves === 1) {
        await route.fulfill({
          json: {
            errors: [
              { message: "Falha ao salvar orçamento.", extensions: { code: "OPERATION_FAILED" } },
            ],
          },
        });
      } else if (operationName === "Trip" && failReads) {
        readsFailed++;
        if (failure === "network") await route.abort("failed");
        else if (failure === "http") await route.fulfill({ status: 503, body: "Unavailable" });
        else
          await route.fulfill({
            json: {
              data: null,
              errors: [
                { message: "Falha ao carregar viagem.", extensions: { code: "OPERATION_FAILED" } },
              ],
            },
          });
      } else await route.fallback();
    });
    await page.goto("/viagens/" + tripId);
    await page.getByRole("button", { name: "Editar orçamento" }).click();
    const modal = page.getByRole("dialog");
    const input = modal.getByLabel("Orçamento estimado por pessoa (R$)");
    await input.fill(" 600,5 ");
    await modal.getByRole("button", { name: "Salvar orçamento" }).click();
    await expect(modal.getByRole("alert")).toContainText("Falha ao salvar orçamento.");
    failReads = true;
    for (let cycle = 1; cycle <= 2; cycle++) {
      await page.clock.fastForward(30000);
      await expect.poll(() => readsFailed).toBe(cycle);
      await expect(input).toHaveValue(" 600,5 ");
      await expect(
        modal.getByRole("alert").filter({ hasText: "Não foi possível atualizar a viagem" }),
      ).toBeVisible();
      await expect(page.getByTestId("budget-value")).toContainText("500,00");
    }
    expect(api.trips[0].budgetPerPerson).toBe("500.00");
    await expect(page.getByText("Orçamento salvo.", { exact: true })).toHaveCount(0);
    failReads = false;
    api.trips[0].budgetPerPerson = "550.00";
    await page.clock.fastForward(30000);
    await expect(page.getByTestId("budget-value")).toContainText("550,00");
    await expect(input).toHaveValue(" 600,5 ");
    await expect(modal.getByText(/Não foi possível atualizar a viagem/)).toHaveCount(0);
    await modal.getByRole("button", { name: "Salvar orçamento" }).click();
    await expect(modal).toHaveCount(0);
    await expect(page.getByTestId("budget-value")).toContainText("600,50");
    await expect(page.getByRole("button", { name: "Editar orçamento" })).toBeFocused();
    expect(saves).toBe(2);
  });
}

for (const denial of ["UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", 401, 403, 404] as const) {
  test(`polling com acesso negado ${denial} oculta orçamento e modal`, async ({ page }) => {
    await page.clock.install();
    await mockApi(page, [{ ...initialTrip, budgetPerPerson: "500.00" }]);
    let response: "success" | "denied" | "offline" = "success";
    let offlineReads = 0;
    await page.route("**/api/graphql", async (route) => {
      if (route.request().postDataJSON().operationName !== "Trip" || response === "success") {
        await route.fallback();
        return;
      }
      if (response === "offline") {
        offlineReads++;
        await route.abort("failed");
        return;
      }
      if (typeof denial === "number") await route.fulfill({ status: denial, body: "Denied" });
      else
        await route.fulfill({
          json: {
            data: null,
            errors: [{ message: "Acesso à viagem indisponível.", extensions: { code: denial } }],
          },
        });
    });
    await page.goto("/viagens/" + tripId);
    await page.getByRole("button", { name: "Editar orçamento" }).click();
    await page.getByLabel("Orçamento estimado por pessoa (R$)").fill("600");
    response = "denied";
    await page.clock.fastForward(30000);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByTestId("budget-value")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
    response = "offline";
    await page.clock.fastForward(30000);
    await expect.poll(() => offlineReads).toBe(1);
    await expect(page.getByTestId("budget-value")).toHaveCount(0);
    const retry = page.getByRole("button", { name: "Tentar novamente" });
    await retry.click();
    await expect.poll(() => offlineReads).toBe(2);
    await expect(page.getByTestId("budget-value")).toHaveCount(0);
    response = "success";
    await retry.click();
    await expect(page.getByTestId("budget-value")).toContainText("500,00");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
}

test("falha na consulta inicial permite repetir sem apresentar detalhes inexistentes", async ({
  page,
}) => {
  await mockApi(page);
  let fail = true;
  const uncaught: string[] = [];
  page.on("pageerror", (error) => uncaught.push(error.message));
  await page.route("**/api/graphql", async (route) => {
    if (route.request().postDataJSON().operationName === "Trip" && fail)
      await route.abort("failed");
    else await route.fallback();
  });
  await page.goto("/viagens/" + tripId);
  const retry = page.getByRole("button", { name: "Tentar novamente" });
  await expect(retry).toBeVisible();
  await expect(page.getByTestId("budget-value")).toHaveCount(0);
  await retry.click();
  await expect(retry).toBeVisible();
  fail = false;
  await retry.click();
  await expect(page.getByTestId("budget-value")).toContainText("Orçamento ainda não definido");
  expect(uncaught).toEqual([]);
});

test("resposta perdida após gravação preserva rascunho, reconcilia pela leitura e permite repetir", async ({
  page,
}) => {
  await page.clock.install();
  const api = await mockApi(page, [{ ...initialTrip, activities: [activity(320)] }]);
  const original = structuredClone(api.trips[0].activities);
  let attempts = 0;
  await page.route("**/api/graphql", async (route) => {
    const { operationName, variables } = route.request().postDataJSON();
    if (operationName === "SetTripBudget" && ++attempts === 1) {
      api.trips[0].budgetPerPerson = variables.input.budgetPerPerson;
      await route.fulfill({
        json: {
          errors: [
            {
              message: "Não foi possível carregar a viagem.",
              extensions: { code: "OPERATION_FAILED" },
            },
          ],
        },
      });
    } else await route.fallback();
  });
  await page.goto("/viagens/" + tripId);
  await page.getByRole("button", { name: "Definir orçamento" }).click();
  const modal = page.getByRole("dialog");
  const input = modal.getByLabel("Orçamento estimado por pessoa (R$)");
  await input.fill("500");
  await modal.getByRole("button", { name: "Salvar orçamento" }).click();
  await expect(modal.getByRole("alert")).toContainText("Não foi possível");
  await expect(input).toHaveValue("500");
  await expect(page.getByText("Orçamento salvo.", { exact: true })).toHaveCount(0);
  await page.clock.fastForward(30000);
  await expect(page.getByTestId("budget-value")).toContainText("500,00");
  await expect(input).toHaveValue("500");
  await modal.getByRole("button", { name: "Salvar orçamento" }).click();
  await expect(modal).toHaveCount(0);
  expect(attempts).toBe(2);
  expect(api.trips[0].activities).toEqual(original);
});

test("remoção por teclado restaura foco, permite cancelar e repetir após falha", async ({
  page,
}) => {
  const api = await mockApi(page, [
    { ...initialTrip, budgetPerPerson: "500.00", activities: [activity(320)] },
  ]);
  const original = structuredClone(api.trips[0].activities);
  let attempts = 0;
  await page.route("**/api/graphql", async (route) => {
    if (route.request().postDataJSON().operationName === "SetTripBudget" && ++attempts === 1) {
      await route.fulfill({
        json: {
          errors: [
            {
              message: "Não foi possível remover o orçamento.",
              extensions: { code: "OPERATION_FAILED" },
            },
          ],
        },
      });
    } else await route.fallback();
  });
  await page.goto("/viagens/" + tripId);
  const summary = page.getByRole("region", { name: "Resumo de custos" });
  const remove = summary.getByRole("button", { name: "Remover orçamento" });
  await remove.focus();
  await page.keyboard.press("Enter");
  await expect(summary.getByRole("button", { name: "Confirmar", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(summary.getByRole("button", { name: "Editar orçamento" })).toBeFocused();
  expect(attempts).toBe(0);
  for (let i = 0; i < 2; i++) {
    await remove.focus();
    await page.keyboard.press("Enter");
    await expect(summary.getByRole("button", { name: "Confirmar", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    if (i === 0) {
      await expect(
        page.getByRole("alert").filter({ hasText: "Não foi possível remover" }),
      ).toBeVisible();
      await expect(summary.getByRole("button", { name: "Editar orçamento" })).toBeFocused();
      await expect(page.getByTestId("budget-value")).toContainText("500,00");
    }
  }
  await expect(summary.getByRole("button", { name: "Definir orçamento" })).toBeFocused();
  expect(api.trips[0].activities).toEqual(original);
});

test("quantia longa e modal permanecem utilizáveis em viewport baixo", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 400 });
  await mockApi(page);
  await page.goto("/viagens/" + tripId);
  await page.getByRole("button", { name: "Definir orçamento" }).click();
  const modal = page.getByRole("dialog");
  await modal
    .getByLabel("Orçamento estimado por pessoa (R$)")
    .fill("900719925474099312345678901234567890.01");
  await expect(modal).toHaveCSS("max-height", "368px");
  expect(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("budget-modal.png") });
  await modal.getByRole("button", { name: "Salvar orçamento" }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByTestId("budget-value")).toContainText("1.234.567.890,01");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page
    .getByRole("region", { name: "Resumo de custos" })
    .screenshot({ path: testInfo.outputPath("budget-summary.png") });
});
