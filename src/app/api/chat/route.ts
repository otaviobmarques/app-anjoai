import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/supabase/server";
import { ai, aiAvailable, CHAT_MODEL, FAST_MODEL, nowBR } from "@/lib/ai";
import { MASTER_PROMPT, PROMPT_VERSION, contextBlock } from "@/lib/prompt";
import { classifyRisk, keywordRisk } from "@/lib/risk";
import { alertCareNetwork } from "@/lib/alerts";
import { overDailyLimit } from "@/lib/limits";

export const runtime = "nodejs";
export const maxDuration = 120;

type Ev =
  | { t: "meta"; conversationId: string }
  | { t: "risk"; level: number }
  | { t: "alerted"; sent: number; total: number }
  | { t: "delta"; text: string }
  | { t: "done"; messageId?: string }
  | { t: "error"; message: string };

const CRISIS_FALLBACK = `Estou aqui com você e me importo com o que você está sentindo. Neste momento não estou conseguindo responder como gostaria, mas você não precisa passar por isso sozinho(a).

Ligue agora para o CVV no 188 (gratuito, 24 horas). Se estiver em perigo, ligue 192 (SAMU) ou 190. Se puder, chame alguém de confiança para ficar perto de você.`;

export async function POST(req: Request) {
  const { supabase, user, profile } = await getSession();
  if (!user || !profile) return new Response("não autenticado", { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { conversationId?: string; text?: string; viaAudio?: boolean };
  const text = (body.text ?? "").trim().slice(0, 4000);
  if (!text) return new Response("mensagem vazia", { status: 400 });

  const kwLevel = keywordRisk(text);
  // Regra fixa: crise nunca é limitada pelo plano
  if (kwLevel < 2 && (await overDailyLimit(supabase, user.id, profile.plan))) {
    return Response.json({ error: "limite", message: "Você chegou ao limite de mensagens de hoje no plano gratuito. Amanhã a conversa continua. O botão SOS e os números de emergência continuam sempre disponíveis." }, { status: 429 });
  }

  let conversationId = body.conversationId;
  if (conversationId) {
    const { data } = await supabase.from("conversations").select("id").eq("id", conversationId).maybeSingle();
    if (!data) conversationId = undefined;
  }
  if (!conversationId) {
    const { data, error } = await supabase.from("conversations").insert({ user_id: user.id, title: text.slice(0, 60) }).select("id").single();
    if (error) return new Response("erro ao criar conversa", { status: 500 });
    conversationId = data.id as string;
  }

  const { data: userMsg } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, user_id: user.id, role: "user", content: text, via_audio: !!body.viaAudio, risk_level: kwLevel || null })
    .select("id")
    .single();

  const userName = profile.name || "Uma pessoa";
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: Ev) => controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      send({ t: "meta", conversationId: conversationId! });

      let shownLevel = 0;
      let alerted = false;
      const raise = async (level: number, source: "palavras" | "classificador", reason: string) => {
        if (level >= 2 && level > shownLevel) {
          shownLevel = level;
          send({ t: "risk", level });
        }
        if (level >= 1) {
          const { data: evId } = await supabase.rpc("log_risk_event", { p_level: level, p_source: source, p_reason: reason, p_message_id: userMsg?.id ?? null });
          if (level >= 3 && !alerted && evId) {
            alerted = true;
            const r = await alertCareNetwork(supabase, { riskEventId: evId as string, kind: "risco", userName });
            send({ t: "alerted", ...r });
          }
        }
      };

      if (kwLevel >= 2) await raise(kwLevel, "palavras", "palavras-chave de risco");

      if (!aiAvailable()) {
        const msg = kwLevel >= 2 ? CRISIS_FALLBACK : "A IA ainda não foi ligada neste ambiente de testes (falta a chave da Anthropic). O botão SOS e os números de emergência funcionam normalmente.";
        send({ t: "delta", text: msg });
        const { data: saved } = await supabase.from("messages").insert({ conversation_id: conversationId, user_id: user.id, role: "assistant", content: msg }).select("id").single();
        send({ t: "done", messageId: saved?.id });
        controller.close();
        return;
      }

      const client = ai();
      const [{ data: history }, { data: memory }] = await Promise.all([
        supabase.from("messages").select("role,content").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(24),
        supabase.from("journey_memory").select("summary").maybeSingle(),
      ]);
      const turns = (history ?? []).reverse() as { role: "user" | "assistant"; content: string }[];
      const recentUser = turns.filter((m) => m.role === "user").slice(-3).map((m) => m.content);

      // Camada 2: classificador em paralelo
      const classifier = classifyRisk(client, recentUser)
        .then(async (r) => {
          if (!r) return raise(1, "classificador", "classificador sem resposta — revisar");
          if (r.level >= 1) return raise(r.level, "classificador", r.reason);
        })
        .catch(() => raise(1, "classificador", "classificador falhou — revisar"));

      const messages: Anthropic.Beta.BetaMessageParam[] = turns.map((m) => ({ role: m.role, content: m.content }));
      if (messages.length === 0 || messages[0].role !== "user") messages.unshift({ role: "user", content: "(início da conversa)" });
      if (kwLevel >= 2) {
        messages.push({ role: "system", content: `Sinal de risco detectado na última mensagem (nível ${kwLevel} de 3). Siga o PROTOCOLO DE CRISE agora.` } as unknown as Anthropic.Beta.BetaMessageParam);
      }

      let full = "";
      try {
        const s = client.beta.messages.stream({
          model: CHAT_MODEL,
          max_tokens: 8000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "low" },
          system: [
            { type: "text", text: MASTER_PROMPT, cache_control: { type: "ephemeral" } },
            { type: "text", text: contextBlock({ name: profile.name, tradition: profile.tradition, bibleVersion: profile.bible_version, memory: (memory as { summary?: string } | null)?.summary, nowBR: nowBR() }) },
          ],
          messages,
        });
        for await (const ev of s) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            full += ev.delta.text;
            send({ t: "delta", text: ev.delta.text });
          }
        }
        const final = await s.finalMessage();
        if (final.stop_reason === "refusal" && !full.trim()) {
          full = shownLevel >= 2 || kwLevel >= 2 ? CRISIS_FALLBACK : "Não consigo ajudar com isso do jeito que foi pedido, mas continuo aqui para conversar sobre o que você está vivendo.";
          send({ t: "delta", text: full });
        }
      } catch (e) {
        console.error("chat error", e);
        await classifier;
        if (shownLevel >= 2 || kwLevel >= 2) {
          if (!full) send({ t: "delta", text: CRISIS_FALLBACK });
          full ||= CRISIS_FALLBACK;
        } else {
          send({ t: "error", message: "Não consegui responder agora. Tente de novo em instantes." });
        }
      }

      await classifier;
      let savedId: string | undefined;
      if (full.trim()) {
        const { data: saved } = await supabase
          .from("messages")
          .insert({ conversation_id: conversationId, user_id: user.id, role: "assistant", content: full, channel: `app:${PROMPT_VERSION}` })
          .select("id")
          .single();
        savedId = saved?.id;
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      }
      send({ t: "done", messageId: savedId });

      // Memória da jornada: atualiza a cada 6 mensagens da pessoa
      try {
        const userCount = turns.filter((m) => m.role === "user").length;
        if (full && userCount % 6 === 0) await updateMemory(client, supabase, user.id, (memory as { summary?: string } | null)?.summary ?? "", turns.slice(-12));
      } catch (e) {
        console.error("memory error", e);
      }
      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}

async function updateMemory(
  client: Anthropic,
  supabase: Awaited<ReturnType<typeof getSession>>["supabase"],
  userId: string,
  previous: string,
  turns: { role: string; content: string }[],
) {
  const res = await client.messages.create({
    model: FAST_MODEL,
    max_tokens: 2000,
    output_config: { effort: "low" },
    system:
      "Você mantém a 'memória da jornada' de uma pessoa num app cristão de apoio. Reescreva a memória em até 12 linhas curtas, em português, com: lutas atuais, pedidos de oração, compromissos assumidos, vitórias, pessoas importantes (só primeiro nome) e o tom que ajuda. Não guarde endereços, documentos, telefones ou detalhes de métodos de autolesão. Devolva só o texto da memória.",
    messages: [
      { role: "user", content: `Memória atual:\n${previous || "(vazia)"}\n\nConversa recente:\n${turns.map((t) => `${t.role === "user" ? "Pessoa" : "Anjo"}: ${t.content}`).join("\n")}` },
    ],
  });
  const summary = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
  if (!summary || res.stop_reason === "refusal") return;
  const { data: cur } = await supabase.from("journey_memory").select("version").maybeSingle();
  await supabase.from("journey_memory").upsert({ user_id: userId, summary, version: ((cur as { version?: number } | null)?.version ?? 0) + 1, updated_at: new Date().toISOString() });
}
