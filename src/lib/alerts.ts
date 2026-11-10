import type { SupabaseClient } from "@supabase/supabase-js";
import { pushAvailable, sendPush, type PushTarget } from "./push";

type Contact = { id: string; name: string; email: string | null; status: string; alert_on_risk: boolean; alert_on_sos: boolean; contact_user_id: string | null };

/**
 * Avisa a Rede de Cuidado.
 * - Contato com conta vinculada: aviso dentro do app ("Pessoas que acompanho") + notificação no aparelho.
 * - Contato sem conta: e-mail (Resend). Sem RESEND_API_KEY/ALERT_FROM, fica registrado como "pendente" no painel.
 * O contato nunca recebe o conteúdo das conversas.
 */
export async function alertCareNetwork(
  supabase: SupabaseClient,
  opts: { riskEventId: string; kind: "risco" | "sos"; userName: string },
) {
  const { data: contacts } = await supabase
    .from("trusted_contacts")
    .select("id,name,email,status,alert_on_risk,alert_on_sos,contact_user_id")
    .eq("status", "confirmado");
  const targets = ((contacts ?? []) as Contact[]).filter((c) => (opts.kind === "sos" ? c.alert_on_sos : c.alert_on_risk));
  if (targets.length === 0) {
    await supabase.rpc("record_alert", { p_risk_event_id: opts.riskEventId, p_contact_id: null, p_status: "falhou", p_error: "sem contato confirmado" });
    return { sent: 0, total: 0 };
  }

  let sent = 0;

  // 1) No app + notificação
  const linked = targets.filter((c) => c.contact_user_id);
  if (linked.length) {
    const { data: subs } = pushAvailable() ? await supabase.rpc("care_push_targets", { p_risk_event_id: opts.riskEventId }) : { data: [] };
    const byContact = new Map<string, PushTarget[]>();
    for (const s of (subs ?? []) as (PushTarget & { contact_id: string })[]) {
      byContact.set(s.contact_id, [...(byContact.get(s.contact_id) ?? []), s]);
    }
    const title = opts.kind === "sos" ? `${opts.userName} pediu ajuda agora` : `${opts.userName} pode precisar de você agora`;
    for (const c of linked) {
      await supabase.rpc("record_alert", { p_risk_event_id: opts.riskEventId, p_contact_id: c.id, p_status: "enviado", p_channel: "app" });
      sent++;
      for (const t of byContact.get(c.id) ?? []) {
        const r = await sendPush(t, { title, body: "Toque para ver o aviso e entrar em contato.", url: "/cuidando", tag: `alerta-${opts.riskEventId}` });
        if (r === "expirada") await supabase.rpc("drop_push_subscription", { p_endpoint: t.endpoint });
      }
    }
  }

  // 2) E-mail para quem não tem conta vinculada
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_FROM;
  for (const c of targets.filter((x) => !x.contact_user_id)) {
    if (!key || !from || !c.email) {
      await supabase.rpc("record_alert", {
        p_risk_event_id: opts.riskEventId, p_contact_id: c.id, p_status: "pendente",
        p_error: !c.email ? "contato sem e-mail e sem conta no app" : "contato sem conta no app; e-mail não configurado",
      });
      continue;
    }
    const subject = opts.kind === "sos" ? `${opts.userName} pediu ajuda agora` : `${opts.userName} pode precisar de você agora`;
    const text = `Olá, ${c.name}.

Você faz parte da Rede de Cuidado de ${opts.userName} no app Anjo IA.
${opts.kind === "sos" ? `${opts.userName} apertou o botão SOS.` : `Percebemos sinais de que ${opts.userName} está passando por um momento muito difícil.`}

Por favor, entre em contato agora: ligue, mande mensagem ou vá até essa pessoa. Ouça sem julgar e não a deixe sozinha.

Se houver perigo imediato, ligue 192 (SAMU) ou 190 (Polícia).
Para apoio emocional, o CVV atende 24h pelo 188.

Por privacidade, não enviamos o conteúdo das conversas.

Anjo IA — este é um aviso automático. O Anjo IA não é serviço médico nem de emergência.`;
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [c.email], subject, text }),
      });
      if (!r.ok) throw new Error(`resend ${r.status}`);
      sent++;
      await supabase.rpc("record_alert", { p_risk_event_id: opts.riskEventId, p_contact_id: c.id, p_status: "enviado" });
    } catch (e) {
      await supabase.rpc("record_alert", { p_risk_event_id: opts.riskEventId, p_contact_id: c.id, p_status: "falhou", p_error: String(e) });
    }
  }
  return { sent, total: targets.length };
}

export async function sendInviteEmail(opts: { to: string; contactName: string; userName: string; token: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_FROM;
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!key || !from || !base) return false;
  const link = `${base}/convite/${opts.token}`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [opts.to],
      subject: `${opts.userName} quer você na Rede de Cuidado`,
      text: `Olá, ${opts.contactName}.\n\n${opts.userName} escolheu você como pessoa de confiança no app Anjo IA. Se um dia ${opts.userName} apertar o botão SOS ou passar por um momento de risco, você receberá um aviso por e-mail para entrar em contato.\n\nVocê não recebe o conteúdo das conversas.\n\nPara aceitar ou recusar: ${link}\n\nAnjo IA`,
    }),
  });
  return r.ok;
}
