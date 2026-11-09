import { getSession } from "@/lib/supabase/server";
import { alertCareNetwork } from "@/lib/alerts";

export const runtime = "nodejs";

export async function POST() {
  const { supabase, user, profile } = await getSession();
  if (!user) return Response.json({ error: "Entre na sua conta para avisar a Rede de Cuidado. Os números de emergência funcionam sem login." }, { status: 401 });
  const { data: evId, error } = await supabase.rpc("log_risk_event", { p_level: 3, p_source: "sos", p_reason: "botão SOS" });
  if (error || !evId) return Response.json({ error: "Não consegui registrar o SOS. Ligue 188 ou 192." }, { status: 500 });
  const r = await alertCareNetwork(supabase, { riskEventId: evId as string, kind: "sos", userName: profile?.name || "Uma pessoa" });
  return Response.json(r);
}
