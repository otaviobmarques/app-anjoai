import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Envio automático de avisos pelo WhatsApp para o Anjo da Guarda (contato de emergência).
 * Configuração (não secreta) em app_settings.key = "whatsapp", definida no painel de administrador.
 * Segredos só na Vercel:
 *   - API oficial (Meta Cloud API / Domma Chat): WHATSAPP_META_TOKEN
 *   - QR Code (Evolution API):                   WHATSAPP_EVOLUTION_APIKEY
 */
export type WhatsAppConfig = {
  provider: "desligado" | "meta" | "evolution";
  meta?: { phone_number_id?: string; template?: string; lang?: string; api_base?: string };
  evolution?: { base_url?: string; instance?: string };
};

export const DEFAULT_WA: WhatsAppConfig = { provider: "desligado", meta: { template: "alerta_rede_cuidado", lang: "pt_BR" }, evolution: {} };

/** Texto sugerido para aprovar na Meta como modelo "alerta_rede_cuidado" (categoria Utilidade). */
export const META_TEMPLATE_BODY =
  "Olá, {{1}}. {{2}} pode precisar de você agora. Por favor, entre em contato com essa pessoa assim que puder. Em perigo imediato, ligue 192 ou 190. Mensagem automática do Anjo IA.";

export async function getWhatsAppConfig(supabase: SupabaseClient): Promise<WhatsAppConfig> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", "whatsapp").maybeSingle();
  return { ...DEFAULT_WA, ...((data?.value as WhatsAppConfig) ?? {}) };
}

export function secretsStatus() {
  return { meta: Boolean(process.env.WHATSAPP_META_TOKEN), evolution: Boolean(process.env.WHATSAPP_EVOLUTION_APIKEY) };
}

export function normalizePhone(phone: string) {
  let d = phone.replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  return d;
}

export function alertText(o: { contactName: string; userName: string; userPhone?: string | null; kind: "sos" | "risco" }) {
  const first = o.contactName.split(" ")[0];
  return [
    `Olá, ${first}. Aqui é o Anjo IA.`,
    o.kind === "sos" ? `${o.userName} pediu ajuda agora pelo botão SOS.` : `${o.userName} pode estar passando por um momento muito difícil e precisar de você agora.`,
    `Por favor, entre em contato${o.userPhone ? ` (${o.userPhone})` : ""}: ligue, mande mensagem ou vá até essa pessoa. Ouça sem julgar.`,
    "Em perigo imediato, ligue 192 (SAMU) ou 190. Apoio emocional 24h: CVV 188.",
    "Mensagem automática. Por privacidade, não enviamos o conteúdo das conversas.",
  ].join("\n\n");
}

const timeout = () => AbortSignal.timeout(15000);

export async function sendWhatsApp(cfg: WhatsAppConfig, to: string, o: { contactName: string; userName: string; userPhone?: string | null; kind: "sos" | "risco" }) {
  const number = normalizePhone(to);
  if (cfg.provider === "meta") {
    const token = process.env.WHATSAPP_META_TOKEN;
    const id = cfg.meta?.phone_number_id;
    if (!token || !id) return { ok: false, error: "API oficial sem token ou sem phone_number_id" };
    const base = (cfg.meta?.api_base || "https://graph.facebook.com/v21.0").replace(/\/$/, "");
    const r = await fetch(`${base}/${id}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: number,
        type: "template",
        template: {
          name: cfg.meta?.template || "alerta_rede_cuidado",
          language: { code: cfg.meta?.lang || "pt_BR" },
          components: [{ type: "body", parameters: [{ type: "text", text: o.contactName.split(" ")[0] }, { type: "text", text: o.userName }] }],
        },
      }),
      signal: timeout(),
    }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }) as const);
    return r.ok ? { ok: true } : { ok: false, error: `Meta ${r.status}: ${(await r.text()).slice(0, 200)}` };
  }
  if (cfg.provider === "evolution") {
    const key = process.env.WHATSAPP_EVOLUTION_APIKEY;
    const base = cfg.evolution?.base_url?.replace(/\/$/, "");
    const inst = cfg.evolution?.instance;
    if (!key || !base || !inst) return { ok: false, error: "QR Code sem chave, endereço ou instância" };
    const r = await fetch(`${base}/message/sendText/${encodeURIComponent(inst)}`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ number, text: alertText(o) }),
      signal: timeout(),
    }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }) as const);
    return r.ok ? { ok: true } : { ok: false, error: `Evolution ${r.status}: ${(await r.text()).slice(0, 200)}` };
  }
  return { ok: false, error: "WhatsApp desligado" };
}

/** QR Code e estado da conexão (só Evolution API). */
export async function evolutionConnect(cfg: WhatsAppConfig) {
  const key = process.env.WHATSAPP_EVOLUTION_APIKEY;
  const base = cfg.evolution?.base_url?.replace(/\/$/, "");
  const inst = cfg.evolution?.instance;
  if (!key || !base || !inst) return { error: "Configure endereço, instância e a chave WHATSAPP_EVOLUTION_APIKEY na Vercel." };
  const h = { apikey: key };
  try {
    const st = await fetch(`${base}/instance/connectionState/${encodeURIComponent(inst)}`, { headers: h, signal: timeout() });
    const sj = (await st.json().catch(() => ({}))) as { instance?: { state?: string } };
    const state = sj.instance?.state ?? (st.ok ? "desconhecido" : `erro ${st.status}`);
    if (state === "open") return { state };
    const qr = await fetch(`${base}/instance/connect/${encodeURIComponent(inst)}`, { headers: h, signal: timeout() });
    const qj = (await qr.json().catch(() => ({}))) as { base64?: string; code?: string };
    return { state, qr: qj.base64 ?? null };
  } catch (e) {
    return { error: `Não consegui falar com a Evolution API: ${String(e).slice(0, 120)}` };
  }
}
