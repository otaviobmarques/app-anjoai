import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { ContactGate } from "./ContactGate";

export const dynamic = "force-dynamic";

export default async function ContatoEmergencia({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { user } = await getSession();
  if (!user) redirect("/entrar");
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/inicio";
  return <ContactGate next={safe} />;
}
