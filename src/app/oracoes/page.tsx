import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { Prayers } from "./Prayers";

export default async function Oracoes() {
  const { supabase, user } = await getSession();
  if (!user) redirect("/entrar");
  const [{ data: saved }, { data: requests }] = await Promise.all([
    supabase.from("prayers").select("id,topic,content,saved,created_at").eq("saved", true).order("created_at", { ascending: false }).limit(50),
    supabase.from("prayer_requests").select("id,request,status,answer_note,created_at").neq("status", "arquivado").order("created_at", { ascending: false }).limit(50),
  ]);
  return (
    <AppShell active="/oracoes">
      <Prayers saved={saved ?? []} requests={requests ?? []} />
    </AppShell>
  );
}
