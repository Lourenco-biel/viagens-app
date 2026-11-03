import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MemberActions } from "./member-actions";
import { RemoveMemberDialog } from "./remove-member-dialog";

function Preview({
  member,
  fail = false,
}: {
  member: { userId: string; displayName: string; isOwner: boolean };
  fail?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  return (
    <section className="m-6 max-w-sm space-y-4 rounded-xl border p-5">
      <h2 id="members-heading" tabIndex={-1} className="text-xl font-semibold">
        Participantes
      </h2>
      {!removed && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium break-words">{member.displayName}</p>
            <p className="text-xs text-muted-foreground">Participante</p>
          </div>
          <MemberActions member={member} disabled={open} onRemoveAction={() => setOpen(true)} />
        </div>
      )}
      {removed && <p role="status">Participante removido.</p>}
      {open && (
        <RemoveMemberDialog
          member={member}
          onCloseAction={() => setOpen(false)}
          onRemoveAction={async () => {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            if (fail) throw new Error("offline");
          }}
          onRemovedAction={() => {
            setOpen(false);
            setRemoved(true);
          }}
        />
      )}
    </section>
  );
}

const meta = {
  title: "Viagens/MemberActions",
  component: MemberActions,
  tags: ["autodocs"],
  args: {
    member: { userId: "story-guest", displayName: "Ana", isOwner: false },
    disabled: false,
    onRemoveAction: () => {},
  },
  render: (args) => <Preview member={args.member} />,
} satisfies Meta<typeof MemberActions>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Remocao: Story = {};
export const NomeComprido: Story = {
  args: {
    member: {
      userId: "story-long-name",
      displayName: "Ana Carolina de Albuquerque e Vasconcelos",
      isOwner: false,
    },
  },
};
export const ErroDeRede: Story = { render: (args) => <Preview member={args.member} fail /> };
