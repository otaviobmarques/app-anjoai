import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { Onboarding } from "./Onboarding";

export default async function BoasVindas() {
  const { user, profile } = await getSession();
  if (!user) redirect("/entrar");
  return <Onboarding initialName={profile?.name ?? ""} />;
}
