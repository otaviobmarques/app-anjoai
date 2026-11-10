import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { PersonHistory } from "./PersonHistory";

export const dynamic = "force-dynamic";

export default async function Pessoa({ params }: { params: Promise<{ id: string }> }) {
  const { user, profile } = await getSession();
  if (!user) redirect("/entrar");
  if (!profile?.is_admin) redirect("/inicio");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/pessoas");
  return <PersonHistory userId={id} />;
}
