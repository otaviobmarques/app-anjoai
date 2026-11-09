import { getSession } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/alerts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { supabase, user, profile } = await getSession();
  if (!user) return new Response("não autenticado", { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { name?: string; relation?: string; email?: string; phone?: string; consent?: boolean };
  const name = (b.name ?? "").trim().slice(0, 80);
  const email = (b.email ?? "").trim().toLowerCase().slice(0, 200);
  const phone = (b.phone ?? "").replace(/[^\d+]/g, "").slice(0, 20);
  if (!name || (!email && !phone)) return Response.json({ error: "Informe o nome e um e-mail ou telefone." }, { status: 400 });
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "E-mail inválido." }, { status: 400 });
  if (!b.consent) return Response.json({ error: "Confirme que essa pessoa pode ser avisada." }, { status: 400 });

  const { count } = await supabase.from("trusted_contacts").select("id", { count: "exact", head: true }).neq("status", "recusado");
  if ((count ?? 0) >= 2) return Response.json({ error: "Você já tem dois contatos de confiança." }, { status: 400 });

  const { data, error } = await supabase
    .from("trusted_contacts")
    .insert({ user_id: user.id, name, relation: b.relation?.slice(0, 40) || null, email: email || null, phone: phone || null, consent_at: new Date().toISOString() })
    .select("*")
    .single();
  if (error) return Response.json({ error: "Não consegui salvar o contato." }, { status: 500 });
  await supabase.from("consents").insert({ user_id: user.id, kind: "rede_de_cuidado", version: "1", granted: true });

  let invited = false;
  if (email) invited = await sendInviteEmail({ to: email, contactName: name, userName: profile?.name || "Uma pessoa", token: data.invite_token });
  return Response.json({ contact: data, invited });
}
