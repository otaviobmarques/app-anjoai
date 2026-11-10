import { getSession } from "@/lib/supabase/server";
import { ai, aiAvailable, CHAT_MODEL, FAST_MODEL } from "@/lib/ai";

export const runtime = "nodejs";

// Testa a conexão com a Anthropic (só administradores)
export async function POST() {
  const { user, profile } = await getSession();
  if (!user || !profile?.is_admin) return new Response("proibido", { status: 403 });
  if (!aiAvailable()) return Response.json({ ok: false, error: "ANTHROPIC_API_KEY não configurada" });
  const results: Record<string, { ok: boolean; ms: number; error?: string }> = {};
  for (const model of [FAST_MODEL, CHAT_MODEL]) {
    const t = Date.now();
    try {
      await ai().messages.create({ model, max_tokens: 16, output_config: { effort: "low" }, messages: [{ role: "user", content: "Responda apenas: ok" }] });
      results[model] = { ok: true, ms: Date.now() - t };
    } catch (e) {
      const err = e as { status?: number; message?: string };
      results[model] = { ok: false, ms: Date.now() - t, error: `${err.status ?? ""} ${err.message ?? e}`.slice(0, 200) };
    }
  }
  return Response.json({ ok: Object.values(results).every((r) => r.ok), results });
}
