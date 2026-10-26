import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { safeNext } from "@/features/auth/lib/safe-next";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code && getSupabaseConfig()) {
    const db = await createClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(new URL(safeNext(url.searchParams.get("next")), url.origin));
  }
  return NextResponse.redirect(new URL("/entrar?error=link", url.origin));
}
