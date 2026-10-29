import { test, expect, mockApi, initialTrip, tripId } from "./support/fixtures";
import { user } from "./support/session.mjs";
import type { Activity } from "../src/features/trips/model/activity";

const suggestion: Activity = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  createdBy: user.id,
  title: "Visita ao museu",
  day: "2026-12-11",
  startTime: "14:00",
  location: "Centro",
  estimatedCost: 20,
  status: "proposed",
  votes: 1,
  votedByMe: true,
  version: 1,
};

test("edita confirmado, reinicia votos e atualiza dia, custo e foco", async ({
  page,
}, testInfo) => {
  await mockApi(page, [{ ...initialTrip, activities: [{ ...suggestion, status: "confirmed" }] }]);
  await page.goto("/viagens/" + tripId);
  await page.getByRole("button", { name: "Editar passeio" }).click();
  const form = page.getByRole("form", { name: "Editar passeio" });
  await expect(form.getByLabel("Nome do passeio")).toBeFocused();
  await expect(form.getByLabel("Nome do passeio")).toHaveValue(suggestion.title);
  await expect(page.getByText(/Ele voltará para votação/)).toBeVisible();
  await form.getByLabel("Nome do passeio").fill("Museu atualizado");
  await form.getByLabel("Dia", { exact: true }).fill("2026-12-12");
  await form.getByLabel("Horário").fill("");
  await form.getByLabel("Local ou endereço").fill("");
  await form.getByLabel("Custo estimado").fill("30.50");
  await page.screenshot({ path: testInfo.outputPath("editar-passeio.png"), fullPage: true });
  page.once("dialog", (dialog) => dialog.accept());
  await form.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(form).toHaveCount(0);
  const card = page.getByRole("article");
  await expect(card.getByRole("heading")).toHaveText("Museu atualizado");
  await expect(card.getByText("0 votos")).toBeVisible();
  await expect(card.getByText("Em votação", { exact: true })).toBeVisible();
  await expect(card.getByText("Horário a combinar")).toBeVisible();
  await expect(card.getByRole("button", { name: "Editar passeio" })).toBeFocused();
  await expect(page.getByText("Passeios confirmados · por pessoa").locator("..")).toContainText(
    "0,00",
  );
  await page.reload();
  await expect(page.getByRole("heading", { name: "Museu atualizado" })).toBeVisible();
  await expect(page.locator('time[datetime="2026-12-12"]')).toBeVisible();
});

test("não altera votos em salvamento sem mudanças e permite cancelar correções", async ({
  page,
}) => {
  await mockApi(page, [{ ...initialTrip, activities: [suggestion] }]);
  await page.goto("/viagens/" + tripId);
  await page.getByRole("button", { name: "Editar passeio" }).click();
  const form = page.getByRole("form", { name: "Editar passeio" });
  await form.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status")).toHaveText("Nenhuma alteração para salvar.");
  await expect(page.getByText("1 voto", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Editar passeio" }).click();
  await form.getByLabel("Nome do passeio").fill("Descartar alteração");
  page.once("dialog", (dialog) => dialog.accept());
  await form.getByRole("button", { name: "Cancelar edição" }).click();
  await expect(page.getByRole("heading", { name: suggestion.title })).toBeVisible();
  await expect(page.getByRole("button", { name: "Editar passeio" })).toBeFocused();
});

test("valida campos e conserva o rascunho após erro de rede", async ({ page }) => {
  await mockApi(page, [{ ...initialTrip, activities: [{ ...suggestion, votes: 0 }] }]);
  await page.goto("/viagens/" + tripId);
  await page.getByRole("button", { name: "Editar passeio" }).click();
  const form = page.getByRole("form", { name: "Editar passeio" });
  await form.getByLabel("Dia", { exact: true }).fill("2026-12-20");
  await form.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(form.getByRole("alert")).toContainText("dentro do período");
  await form.getByLabel("Dia", { exact: true }).fill("2026-12-11");
  await form.getByLabel("Custo estimado").fill("");
  await form.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(form.getByLabel("Custo estimado")).toHaveAttribute("aria-invalid", "true");
  await form.getByLabel("Custo estimado").fill("0");
  await form.getByLabel("Nome do passeio").fill("Meu rascunho");
  await page.route("**/api/graphql", async (route) => {
    if (route.request().postDataJSON().operationName === "UpdateActivity") await route.abort();
    else await route.fallback();
  });
  await form.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(form.getByRole("alert")).toContainText("conexão");
  await expect(form.getByLabel("Nome do passeio")).toHaveValue("Meu rascunho");
});

test("conflito preserva o rascunho até recarregar explicitamente", async ({ page }) => {
  await mockApi(page, [{ ...initialTrip, activities: [{ ...suggestion, votes: 0 }] }]);
  await page.goto("/viagens/" + tripId);
  await page.getByRole("button", { name: "Editar passeio" }).click();
  const form = page.getByRole("form", { name: "Editar passeio" });
  await form.getByLabel("Nome do passeio").fill("Meu rascunho");
  await page.route("**/api/graphql", async (route) => {
    if (route.request().postDataJSON().operationName === "UpdateActivity") {
      await route.fulfill({
        json: {
          errors: [
            {
              message: "Este passeio mudou. Carregue a versão atual antes de salvar.",
              extensions: { code: "CONFLICT" },
            },
          ],
        },
      });
    } else await route.fallback();
  });
  await form.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(form.getByRole("alert")).toContainText("Este passeio mudou");
  await expect(form.getByLabel("Nome do passeio")).toHaveValue("Meu rascunho");
  await mockApi(page, [
    {
      ...initialTrip,
      activities: [{ ...suggestion, title: "Versão de outra pessoa", version: 2 }],
    },
  ]);
  page.once("dialog", (dialog) => dialog.accept());
  await form.getByRole("button", { name: "Carregar versão atual" }).click();
  await expect(form.getByLabel("Nome do passeio")).toHaveValue("Versão de outra pessoa");
});

test("participante só edita a própria sugestão em votação", async ({ page }) => {
  await mockApi(page, [
    {
      ...initialTrip,
      isOwner: false,
      activities: [
        suggestion,
        {
          ...suggestion,
          id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
          title: "Passeio de outra pessoa",
          createdBy: "other",
        },
        {
          ...suggestion,
          id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
          title: "Passeio confirmado",
          status: "confirmed",
        },
      ],
    },
  ]);
  await page.goto("/viagens/" + tripId);
  await expect(page.getByRole("button", { name: "Editar passeio" })).toHaveCount(1);
  await page.getByRole("button", { name: "Editar passeio" }).click();
  await expect(
    page.getByRole("form", { name: "Editar passeio" }).getByLabel("Nome do passeio"),
  ).toHaveValue(suggestion.title);
  await page
    .getByRole("form", { name: "Editar passeio" })
    .getByLabel("Nome do passeio")
    .fill("Minha sugestão corrigida");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("heading", { name: "Minha sugestão corrigida" })).toBeVisible();
});

test("polling atualiza o card sem substituir o texto em edição", async ({ page }) => {
  await page.clock.install();
  await mockApi(page, [{ ...initialTrip, activities: [suggestion] }]);
  await page.goto("/viagens/" + tripId);
  await page.getByRole("button", { name: "Editar passeio" }).click();
  const form = page.getByRole("form", { name: "Editar passeio" });
  await form.getByLabel("Nome do passeio").fill("Rascunho local");
  await mockApi(page, [
    {
      ...initialTrip,
      activities: [
        { ...suggestion, title: "Atualizado pelo grupo", day: "2026-12-12", version: 2 },
      ],
    },
  ]);
  await page.clock.fastForward(31000);
  await expect(page.getByRole("heading", { name: "Atualizado pelo grupo" })).toBeVisible();
  await expect(form.getByLabel("Nome do passeio")).toHaveValue("Rascunho local");
  page.once("dialog", (dialog) => dialog.accept());
  await form.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(form.getByRole("alert")).toContainText("Este passeio mudou");
});
