import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TripsEmptyState } from "./trips-empty-state"; 


const meta = {
  title: "Viagens/TripsEmptyState",
  component: TripsEmptyState,
  tags: ["autodocs"],

  parameters: {
    docs: {
      description: {
        component:
          "Orienta o usuário quando não existem viagens ou quando os filtros não encontram resultados.",
      },
    },
  },

  argTypes: {
    variant: {
      control: "select",
      options: ["no-trips", "no-results"],
      description: "Define o motivo pelo qual a lista está vazia.",
    },
  },
} satisfies Meta<typeof TripsEmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SemViagens: Story = {
  name: "Nenhuma viagem cadastrada",

  args: {
    variant: "no-trips",
  },
};

export const SemResultados: Story = {
  name: "Nenhum resultado nos filtros",

  args: {
    variant: "no-results",
  },
};