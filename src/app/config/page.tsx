import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { Settings } from "./Settings";

export default async function Config() {
  const { supabase, user, profile } = await getSession();
  if (!user || !profile) redirect("/entrar");
  const { data: mem } = await supabase.from("journey_memory").select("summary,updated_at").maybeSingle();
  return (
    <AppShell active="/config">
      <Settings profile={profile} email={user.email ?? ""} memory={(mem as { summary: string } | null)?.summary ?? ""} />
    </AppShell>
  );
}
