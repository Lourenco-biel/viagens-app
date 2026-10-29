import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ActivityForm } from "./activity-form";
import { CombinedGraphQLErrors } from "@apollo/client/errors";

const meta = {
  title: "Viagens/ActivityForm",
  component: ActivityForm,
  tags: ["autodocs"],
  args: {
    startDate: "2026-12-10",
    endDate: "2026-12-12",
    onSaveAction: async () => {},
  },
  parameters: {
    docs: {
      description: {
        component:
          "Sugestão de passeio com data limitada à viagem, horário opcional e estimativa em reais por pessoa. A validação roda no cliente e novamente na API.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActivityForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Inicial: Story = {};
export const ErroAoSalvar: Story = {
  args: {
    onSaveAction: async () => {
      throw new Error("offline");
    },
  },
};

export const Edicao: Story = {
  args: {
    initialValues: {
      title: "Jardim Botânico",
      day: "2026-12-11",
      startTime: "14:00",
      location: "Curitiba",
      estimatedCost: 25,
    },
    onCancelAction: () => {},
    confirmSave: () => window.confirm("Salvar e zerar os votos?"),
  },
};
export const EdicaoComErro: Story = {
  args: { ...Edicao.args, ...ErroAoSalvar.args },
};
export const Conflito: Story = {
  args: {
    ...Edicao.args,
    onSaveAction: async () => {
      throw new CombinedGraphQLErrors({
        errors: [
          {
            message: "Este passeio mudou. Carregue a versão atual antes de salvar.",
            extensions: { code: "CONFLICT" },
          },
        ],
      });
    },
    onReloadAction: async () => {},
  },
};
