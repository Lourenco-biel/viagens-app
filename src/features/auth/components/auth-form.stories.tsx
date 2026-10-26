import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuthForm } from "./auth-form";

const meta = {
  title: "Conta/AuthForm",
  component: AuthForm,
  tags: ["autodocs"],
  args: { mode: "login", configured: false },
  parameters: {
    docs: {
      description: {
        component:
          "Formulários de acesso, cadastro e recuperação. Nesta documentação o envio está desabilitado; o fluxo completo é exercitado pelos testes Playwright.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-md p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AuthForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Entrar: Story = {};
export const Cadastro: Story = { args: { mode: "signup" } };
export const RecuperarSenha: Story = { args: { mode: "reset" } };
