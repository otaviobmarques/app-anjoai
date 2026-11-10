import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { ChangeCredential } from "./ChangeCredential";

export const dynamic = "force-dynamic";

export default async function TrocarSenha({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { user, profile } = await getSession();
  if (!user) redirect("/entrar");
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/inicio";
  return <ChangeCredential usesPin={!!profile?.cpf} next={safe} firstTime={!!profile?.must_change_password} />;
}
