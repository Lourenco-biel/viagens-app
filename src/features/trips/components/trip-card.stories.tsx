import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TripCard } from "./trip-card";

const meta = {
  title: "Viagens/TripCard",
  component: TripCard,
  tags: ["autodocs"],

  parameters: {
    docs: {
      description: {
        component:
          "Apresenta o resumo de uma viagem: nome, destino, período, status e participantes.",
      },
    },
  },

  decorators: [
    (Story) => (
      <div className="w-full max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TripCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Proxima: Story = {
  name: "Próxima viagem",

  args: {
    trip: {
      id: "storybook-florianopolis",
      name: "Praias e trilhas com os amigos",
      destination: "Florianópolis, SC",
      startDate: "2026-12-16",
      endDate: "2026-12-22",
      participantCount: 4,
      status: "upcoming",
    },
  },
};

export const EmAndamento: Story = {
  name: "Viagem em andamento",

  args: {
    trip: {
      id: "storybook-sao-paulo",
      name: "Descobrindo São Paulo",
      destination: "São Paulo, SP",
      startDate: "2026-10-01",
      endDate: "2026-10-10",
      participantCount: 1,
      status: "ongoing",
    },
  },
};

export const Concluida: Story = {
  name: "Viagem concluída",

  args: {
    trip: {
      id: "storybook-rio",
      name: "Feriado no Rio",
      destination: "Rio de Janeiro, RJ",
      startDate: "2026-05-08",
      endDate: "2026-05-12",
      participantCount: 3,
      status: "completed",
    },
  },
};