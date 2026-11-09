import { getSession } from "@/lib/supabase/server";
import { ai, aiAvailable, CHAT_MODEL } from "@/lib/ai";
import { MASTER_PROMPT, contextBlock } from "@/lib/prompt";
import { keywordRisk } from "@/lib/risk";
import { nowBR } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { supabase, user, profile } = await getSession();
  if (!user || !profile) return new Response("não autenticado", { status: 401 });
  const { topic } = (await req.json().catch(() => ({}))) as { topic?: string };
  const t = (topic ?? "").trim().slice(0, 1000);
  if (!t) return Response.json({ error: "Conte pelo que você quer orar." }, { status: 400 });

  const risk = keywordRisk(t);
  if (risk >= 2) {
    await supabase.rpc("log_risk_event", { p_level: risk, p_source: "palavras", p_reason: "pedido de oração com sinal de risco" });
  }

  if (profile.plan !== "pago") {
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const { count } = await supabase.from("prayers").select("id", { count: "exact", head: true }).gte("created_at", weekAgo);
    if ((count ?? 0) >= 7 && risk < 2) return Response.json({ error: "Você chegou às orações personalizadas da semana no plano gratuito. Você pode orar com o Anjo na Conversa." }, { status: 429 });
  }
  if (!aiAvailable()) return Response.json({ error: "A IA ainda não foi ligada neste ambiente de testes." }, { status: 503 });

  const res = await ai().beta.messages.create({
    model: CHAT_MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: [
      { type: "text", text: MASTER_PROMPT, cache_control: { type: "ephemeral" } },
      { type: "text", text: contextBlock({ name: profile.name, tradition: profile.tradition, bibleVersion: profile.bible_version, nowBR: nowBR() }) },
    ],
    messages: [
      {
        role: "user",
        content: `Faça uma oração personalizada para mim, de 8 a 14 linhas, sobre: ${t}\n${risk >= 2 ? "Antes da oração, siga o PROTOCOLO DE CRISE com o encaminhamento (CVV 188, SAMU 192)." : "Responda só com a oração, sem introdução."}`,
      },
    ],
  });
  const content = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
  if (!content) return Response.json({ error: "Não consegui escrever a oração agora. Tente de novo." }, { status: 502 });
  const { data } = await supabase.from("prayers").insert({ user_id: user.id, topic: t, content }).select("id,topic,content,saved,created_at").single();
  return Response.json({ prayer: data, risk });
}
