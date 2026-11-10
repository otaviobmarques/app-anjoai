import { requireReady } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { Peace } from "./Peace";

export const metadata = { title: "Momento de paz" };

export default async function Paz() {
  await requireReady("/paz");
  return (
    <AppShell active="/paz">
      <Peace />
    </AppShell>
  );
}
