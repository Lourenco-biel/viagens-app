import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import { BudgetDialog } from "./budget-dialog";

const meta = {
  title: "Viagens/BudgetDialog",
  component: BudgetDialog,
  tags: ["autodocs"],
  args: {
    initialValue: null,
    returnFocusId: "budget-story",
    onSaveAction: async () => {},
    onCloseAction: () => {},
  },
  render: function Preview(args) {
    const [open, setOpen] = useState(false);
    const attempts = useRef(0);
    return (
      <div className="p-6">
        <Button
          id="budget-story"
          onClick={() => {
            attempts.current = 0;
            setOpen(true);
          }}
        >
          Abrir orçamento
        </Button>
        {open && (
          <BudgetDialog
            {...args}
            onCloseAction={() => setOpen(false)}
            onSaveAction={async (input) => {
              attempts.current++;
              if (attempts.current === 1) await args.onSaveAction(input);
            }}
          />
        )}
      </div>
    );
  },
} satisfies Meta<typeof BudgetDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Definicao: Story = {};
export const Edicao: Story = { args: { initialValue: "500.00" } };
export const Zero: Story = { args: { initialValue: "0.00" } };
export const FalhaNaAtualizacao: Story = {
  args: {
    initialValue: "500.00",
    refreshError:
      "Não foi possível atualizar a viagem. Os últimos dados confirmados foram mantidos.",
  },
};
export const Validacao: Story = {
  parameters: {
    docs: {
      description: {
        story: "Salvar com o campo vazio ou com valor negativo exibe validação associada ao campo.",
      },
    },
  },
};
export const EnvioPendente: Story = {
  args: { onSaveAction: () => new Promise((resolve) => setTimeout(resolve, 5000)) },
};
export const ErroENovaTentativa: Story = {
  args: {
    initialValue: "500.00",
    onSaveAction: async () => {
      throw new Error("offline");
    },
  },
};
