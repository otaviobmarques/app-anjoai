import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { CareDashboard, type CareAlert, type CarePerson } from "./CareDashboard";

export const dynamic = "force-dynamic";

export default async function Cuidando() {
  const { supabase, user } = await getSession();
  if (!user) redirect("/entrar?next=/cuidando");
  const [{ data: people }, { data: alerts }] = await Promise.all([supabase.rpc("my_care_people"), supabase.rpc("my_care_alerts")]);
  return (
    <AppShell active="/inicio">
      <CareDashboard people={(people ?? []) as CarePerson[]} initialAlerts={(alerts ?? []) as CareAlert[]} />
    </AppShell>
  );
}
