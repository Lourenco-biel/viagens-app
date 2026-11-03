import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import { InviteDialog } from "./invite-dialog";

const meta = {
  title: "Viagens/InviteDialog",
  component: InviteDialog,
  tags: ["autodocs"],
  args: {
    pending: false,
    error: "",
    onAcceptAction: () => {},
    onDismissAction: () => {},
  },
  render: function Preview(args) {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-6">
        <Button onClick={() => setOpen(true)}>Abrir convite</Button>
        {open && (
          <InviteDialog
            {...args}
            onAcceptAction={() => setOpen(false)}
            onDismissAction={() => setOpen(false)}
          />
        )}
      </div>
    );
  },
} satisfies Meta<typeof InviteDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Convite: Story = {};
export const Enviando: Story = { args: { pending: true } };
export const Indisponivel: Story = { args: { error: "Convite inválido ou expirado." } };
export const ErroDeRede: Story = {
  args: { error: "Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente." },
};
