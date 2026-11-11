import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef, useState } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { TripCostSummary } from "./trip-cost-summary";

const meta = {
  title: "Viagens/TripCostSummary",
  component: TripCostSummary,
  tags: ["autodocs"],
  args: { budget: "500.00", total: BigInt(32000) },
} satisfies Meta<typeof TripCostSummary>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Restante: Story = {};
export const SemOrcamentoOrganizador: Story = {
  args: { budget: null, actions: <Button>Definir orçamento</Button> },
};
export const SemOrcamentoParticipante: Story = { args: { budget: null } };
export const Limite: Story = { args: { total: BigInt(50000) } };
export const Excesso: Story = { args: { total: BigInt(55000) } };
export const Zero: Story = { args: { budget: "0.00", total: BigInt(0) } };
export const QuantiaLonga: Story = { args: { budget: "900719925474099312345678901234567890.01" } };

export const RemocaoComFalhaRecuperavel: Story = {
  render: function Removal() {
    const [budget, setBudget] = useState<string | null>("500.00");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const attempts = useRef(0);
    const controls = useRef<HTMLDivElement>(null);
    return (
      <div className="space-y-3">
        <TripCostSummary
          budget={budget}
          total={BigInt(32000)}
          actions={
            budget !== null && (
              <div
                ref={controls}
                onClickCapture={() =>
                  requestAnimationFrame(() => controls.current?.querySelector("button")?.focus())
                }
              >
                <ConfirmButton
                  label="Remover orçamento"
                  message="Remover o orçamento? Os passeios e seus custos serão mantidos."
                  disabled={pending}
                  onConfirm={async () => {
                    setPending(true);
                    setError("");
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                    if (++attempts.current === 1)
                      setError("Não foi possível remover o orçamento. Tente novamente.");
                    else setBudget(null);
                    setPending(false);
                    requestAnimationFrame(() => controls.current?.querySelector("button")?.focus());
                  }}
                />
              </div>
            )
          }
        />
        {pending && <p role="status">Removendo orçamento…</p>}
        {error && <p role="alert">{error}</p>}
      </div>
    );
  },
};
