"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "../lib/safe-next";
import { useHydrated } from "@/hooks/use-hydrated";

type Mode = "login" | "signup" | "reset" | "password";
const labels = {
  login: "Entrar",
  signup: "Criar conta",
  reset: "Enviar link de recuperação",
  password: "Salvar nova senha",
};

export function AuthForm({
  mode,
  next = "/viagens",
  configured = true,
}: {
  mode: Mode;
  next?: string;
  configured?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const hydrated = useHydrated();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    setPending(true);
    try {
      const db = createClient();
      const destination = safeNext(next);
      const callback =
        window.location.origin +
        "/auth/callback?next=" +
        encodeURIComponent(mode === "reset" ? "/conta/senha" : destination);
      if (mode === "login") {
        const result = await db.auth.signInWithPassword({ email, password });
        if (result.error) {
          setError("E-mail ou senha inválidos, ou e-mail ainda não confirmado.");
          return;
        }
        window.location.assign(destination);
      } else if (mode === "signup") {
        const result = await db.auth.signUp({
          email,
          password,
          options: {
            data: { name: String(data.get("name") ?? "").trim() },
            emailRedirectTo: callback,
          },
        });
        if (result.error) {
          setError("Não foi possível criar a conta. Verifique os dados e tente novamente.");
          return;
        }
        if (result.data.session) window.location.assign(destination);
        else
          setMessage(
            "Confira seu e-mail para confirmar o cadastro. Se já tiver uma conta, entre ou recupere sua senha.",
          );
      } else if (mode === "reset") {
        const result = await db.auth.resetPasswordForEmail(email, { redirectTo: callback });
        if (result.error) throw result.error;
        setMessage(
          "Se houver uma conta para esse e-mail, você receberá um link para definir uma nova senha.",
        );
      } else {
        const result = await db.auth.updateUser({ password });
        if (result.error) {
          setError(
            "Não foi possível alterar a senha. Use uma senha diferente ou solicite outro link de recuperação.",
          );
          return;
        }
        setMessage("Senha atualizada. Você já pode continuar organizando suas viagens.");
      }
    } catch {
      setError("Não foi possível conectar ao serviço. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {!configured && (
        <p role="status" className="rounded-lg bg-muted p-4 text-sm">
          O serviço ainda está sendo preparado. Volte em breve.
        </p>
      )}
      <form method="post" onSubmit={submit} className="space-y-4" aria-label={labels[mode]}>
        {mode === "signup" && (
          <div className="space-y-2">
            <label htmlFor="name">Seu nome</label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
            />
          </div>
        )}
        {mode !== "password" && (
          <div className="space-y-2">
            <label htmlFor="email">E-mail</label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </div>
        )}
        {mode !== "reset" && (
          <div className="space-y-2">
            <label htmlFor="password">Senha</label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={mode === "login" ? 1 : 8}
              maxLength={128}
            />
            {mode !== "login" && (
              <p className="text-sm text-muted-foreground">Use pelo menos 8 caracteres.</p>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="rounded-lg bg-muted p-4 text-sm">
            {message}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending || !configured || !hydrated}>
          {pending ? "Aguarde..." : labels[mode]}
        </Button>
      </form>
      <div className="flex flex-wrap gap-4 text-sm underline underline-offset-4">
        {mode === "login" ? (
          <>
            <Link href={"/cadastro?next=" + encodeURIComponent(safeNext(next))}>Criar conta</Link>
            <Link href="/recuperar-senha">Esqueci minha senha</Link>
          </>
        ) : (
          <Link
            href={
              mode === "password"
                ? "/viagens"
                : "/entrar?next=" + encodeURIComponent(safeNext(next))
            }
          >
            {mode === "password" ? "Voltar às viagens" : "Voltar para entrar"}
          </Link>
        )}
      </div>
    </div>
  );
}
