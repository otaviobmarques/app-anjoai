import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { NewPerson } from "./NewPerson";

export const dynamic = "force-dynamic";

export default async function Nova() {
  const { user, profile } = await getSession();
  if (!user) redirect("/entrar");
  if (!profile?.is_admin) redirect("/inicio");
  return <NewPerson appUrl={process.env.NEXT_PUBLIC_APP_URL || "https://app.anjoia.com.br"} />;
}
