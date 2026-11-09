import type { SupabaseClient } from "@supabase/supabase-js";

export function startOfTodayBR() {
  const now = new Date();
  const br = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const offset = now.getTime() - br.getTime();
  br.setHours(0, 0, 0, 0);
  return new Date(br.getTime() + offset).toISOString();
}

export async function overDailyLimit(supabase: SupabaseClient, userId: string, plan: string) {
  if (plan === "pago") return false;
  const limit = Number(process.env.FREE_DAILY_MESSAGES ?? 30);
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", startOfTodayBR());
  return (count ?? 0) >= limit;
}
