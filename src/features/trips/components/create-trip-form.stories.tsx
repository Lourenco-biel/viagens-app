import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CreateTripForm } from "./create-trip-form";

const meta = {
  title: "Viagens/CreateTripForm",
  component: CreateTripForm,
  tags: ["autodocs"],

  parameters: {
    docs: {
      description: {
        component:
          "Formulário com validação, revisão e callback de salvamento. A integração real com GraphQL fica no componente NewTrip/EditTrip.",
      },
    },
  },

  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CreateTripForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Inicial: Story = {
  name: "Formulário de nova viagem",
};

export const Edicao: Story = {
  args: {
    initialValues: {
      name: "Férias em Curitiba",
      destination: "Curitiba, PR",
      startDate: "2026-12-10",
      endDate: "2026-12-12",
    },
  },
};

export const FalhaAoSalvar: Story = {
  args: {
    onSaveAction: async () => {
      throw new Error("offline");
    },
  },
};
