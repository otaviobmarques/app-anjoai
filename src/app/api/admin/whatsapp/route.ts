import { getSession } from "@/lib/supabase/server";
import { DEFAULT_WA, META_TEMPLATE_BODY, evolutionConnect, getWhatsAppConfig, secretsStatus, sendWhatsApp, type WhatsAppConfig } from "@/lib/whatsapp-api";

export const runtime = "nodejs";

async function admin() {
  const s = await getSession();
  return s.user && s.profile?.is_admin ? s : null;
}

export async function GET(req: Request) {
  const s = await admin();
  if (!s) return new Response("proibido", { status: 403 });
  const cfg = await getWhatsAppConfig(s.supabase);
  const url = new URL(req.url);
  if (url.searchParams.get("qr") === "1") return Response.json(await evolutionConnect(cfg));
  return Response.json({ config: cfg, secrets: secretsStatus(), template: META_TEMPLATE_BODY });
}

export async function POST(req: Request) {
  const s = await admin();
  if (!s) return new Response("proibido", { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { action?: string; config?: WhatsAppConfig; phone?: string };

  if (b.action === "test") {
    const cfg = await getWhatsAppConfig(s.supabase);
    if (!b.phone || b.phone.replace(/\D/g, "").length < 10) return Response.json({ ok: false, error: "Informe um telefone com DDD." });
    return Response.json(await sendWhatsApp(cfg, b.phone, { contactName: "Teste", userName: "Pessoa de teste", kind: "sos" }));
  }

  const c = b.config ?? DEFAULT_WA;
  const clean: WhatsAppConfig = {
    provider: ["meta", "evolution"].includes(c.provider) ? c.provider : "desligado",
    meta: {
      phone_number_id: c.meta?.phone_number_id?.replace(/\D/g, "").slice(0, 30) || undefined,
      template: c.meta?.template?.replace(/[^a-z0-9_]/gi, "").slice(0, 60) || "alerta_rede_cuidado",
      lang: c.meta?.lang?.slice(0, 10) || "pt_BR",
      api_base: c.meta?.api_base && /^https:\/\//.test(c.meta.api_base) ? c.meta.api_base.slice(0, 200) : undefined,
    },
    evolution: {
      base_url: c.evolution?.base_url && /^https:\/\//.test(c.evolution.base_url) ? c.evolution.base_url.slice(0, 200) : undefined,
      instance: c.evolution?.instance?.replace(/[^\w.-]/g, "").slice(0, 60) || undefined,
    },
  };
  const { error } = await s.supabase.from("app_settings").upsert({ key: "whatsapp", value: clean, updated_by: s.user!.id, updated_at: new Date().toISOString() });
  return error ? Response.json({ ok: false, error: "Não consegui salvar." }, { status: 500 }) : Response.json({ ok: true, config: clean });
}
