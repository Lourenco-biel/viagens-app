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
          "Formulário de nova viagem com validação dos campos e revisão dos dados. Nesta etapa, a viagem ainda não é salva.",
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