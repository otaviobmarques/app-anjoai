import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { CareNetwork } from "./CareNetwork";

export default async function Rede() {
  const { supabase, user } = await getSession();
  if (!user) redirect("/entrar");
  const { data } = await supabase.from("trusted_contacts").select("id,name,relation,email,phone,status,alert_on_risk,alert_on_sos,invite_token").order("created_at");
  return (
    <AppShell active="/rede">
      <CareNetwork initial={data ?? []} appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""} />
    </AppShell>
  );
}
