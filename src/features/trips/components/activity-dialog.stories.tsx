import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { Button } from "@/components/ui/button";
import { ActivityDialog } from "./activity-dialog";
import type { Activity } from "../model/activity";

const activity: Activity = {
  id: "story-activity",
  createdBy: "story-owner",
  title: "Jardim Botânico",
  day: "2026-12-11",
  startTime: "14:00",
  location: "Curitiba",
  estimatedCost: 25,
  status: "proposed",
  votes: 2,
  votedByMe: true,
  version: 1,
};

const meta = {
  title: "Viagens/ActivityDialog",
  component: ActivityDialog,
  tags: ["autodocs"],
  args: {
    startDate: "2026-12-10",
    endDate: "2026-12-12",
    onSaveAction: async () => {},
    onCloseAction: () => {},
  },
  render: function Preview(args) {
    const [open, setOpen] = useState(false);
    const [snapshot, setSnapshot] = useState(args.activity);
    return (
      <div className="p-6">
        <Button
          id={snapshot ? "edit-activity-" + snapshot.id : "suggest-activity"}
          onClick={() => setOpen(true)}
        >
          {snapshot ? "Editar passeio" : "Sugerir passeio"}
        </Button>
        {open && (
          <ActivityDialog
            {...args}
            activity={snapshot}
            onCloseAction={() => setOpen(false)}
            onSaveAction={async (input) => {
              await args.onSaveAction(input);
              setOpen(false);
            }}
            onReloadAction={
              snapshot &&
              (async () => {
                setSnapshot({
                  ...snapshot,
                  title: "Versão atual do passeio",
                  version: snapshot.version + 1,
                });
              })
            }
          />
        )}
      </div>
    );
  },
} satisfies Meta<typeof ActivityDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Criacao: Story = {};
export const Edicao: Story = { args: { activity } };
export const Confirmado: Story = { args: { activity: { ...activity, status: "confirmed" } } };
export const ErroDeRede: Story = {
  args: {
    activity,
    onSaveAction: async () => {
      throw new Error("offline");
    },
  },
};
export const Conflito: Story = {
  args: {
    activity,
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
  },
};
