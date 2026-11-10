import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { Onboarding } from "./Onboarding";

export default async function BoasVindas({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  const { user, profile } = await getSession();
  if (!user) redirect("/entrar");
  return <Onboarding initialName={profile?.name ?? ""} next={safeNext} />;
}
