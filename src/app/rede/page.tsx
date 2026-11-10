import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { CareNetwork, type LastAlert } from "./CareNetwork";

export default async function Rede() {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect("/entrar");
  const [{ data }, { data: alerts }] = await Promise.all([
    supabase.from("trusted_contacts").select("id,name,relation,email,phone,status,alert_on_risk,alert_on_sos,invite_token,kind,profession,contact_user_id").order("created_at"),
    supabase.from("alerts").select("contact_id,channel,status,read_at,acked_at,created_at").not("contact_id", "is", null).order("created_at", { ascending: false }).limit(20),
  ]);
  const last: Record<string, LastAlert> = {};
  for (const a of (alerts ?? []) as (LastAlert & { contact_id: string })[]) if (!last[a.contact_id]) last[a.contact_id] = a;
  return (
    <AppShell active="/rede">
      <CareNetwork initial={(data ?? []).map((c) => ({ ...c, linked: !!c.contact_user_id }))} lastAlerts={last} myPhone={profile?.phone ?? ""} appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""} />
    </AppShell>
  );
}
