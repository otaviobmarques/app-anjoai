import { getSession } from "@/lib/supabase/server";
import { validCPF, validPIN } from "@/lib/cpf";
import { derivePassword, randomPIN, serverKey } from "@/lib/pin-auth";

export const runtime = "nodejs";
const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || "https://app.anjoia.com.br";

// Cadastro pela equipe: Usuário (CPF), PIN, telefone, Anjo da Guarda -> gera o link de acesso
export async function POST(req: Request) {
  const { supabase, user, profile } = await getSession();
  if (!user || !profile?.is_admin) return new Response("proibido", { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { name?: string; cpf?: string; pin?: string; phone?: string; cName?: string; cPhone?: string; cRelation?: string; forceChange?: boolean };
  if (!validCPF(b.cpf ?? "")) return Response.json({ error: "CPF inválido." }, { status: 400 });
  const pin = b.pin ? b.pin : randomPIN();
  if (!validPIN(pin)) return Response.json({ error: "O PIN tem 4 números." }, { status: 400 });
  const { data, error } = await supabase.rpc("admin_create_person_cpf", {
    p_server_key: serverKey(), p_admin: user.id, p_name: b.name ?? "", p_cpf: b.cpf, p_phone: b.phone ?? "", p_password: derivePassword(b.cpf!, pin),
    p_contact_name: b.cName ?? "", p_contact_phone: b.cPhone ?? "", p_contact_relation: b.cRelation || null, p_force_change: !!b.forceChange,
  });
  if (error) {
    const m = error.message;
    return Response.json({ error: /já cadastrado/.test(m) ? "Esse CPF já tem conta." : /obrigatório|inválido/.test(m) ? m.charAt(0).toUpperCase() + m.slice(1) + "." : "Não consegui cadastrar." }, { status: 400 });
  }
  const d = data as { user_id: string; invite_token: string };
  const { data: token } = await supabase.rpc("access_link_create", { p_server_key: serverKey(), p_admin: user.id, p_user: d.user_id });
  return Response.json({ ...d, pin, accessLink: token ? `${appUrl()}/acesso/${token}` : null, inviteLink: `${appUrl()}/convite/${d.invite_token}` });
}
