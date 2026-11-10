import { getSession } from "@/lib/supabase/server";
import { validPIN } from "@/lib/cpf";
import { derivePassword, serverKey } from "@/lib/pin-auth";

export const runtime = "nodejs";

// A pessoa logada cria/troca o próprio PIN
export async function POST(req: Request) {
  const { supabase, user, profile } = await getSession();
  if (!user || !profile) return new Response("não autenticado", { status: 401 });
  const cpf = (profile as { cpf?: string | null }).cpf;
  if (!cpf) return Response.json({ error: "Esta conta não usa PIN." }, { status: 400 });
  const { pin = "" } = (await req.json().catch(() => ({}))) as { pin?: string };
  if (!validPIN(pin)) return Response.json({ error: "O PIN tem 4 números." }, { status: 400 });
  if (/^(\d)\1{3}$|^(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)$/.test(pin)) return Response.json({ error: "Esse PIN é muito fácil. Escolha outro." }, { status: 400 });
  const { error } = await supabase.rpc("cpf_set_password", { p_server_key: serverKey(), p_user: user.id, p_password: derivePassword(cpf, pin), p_by_admin: null });
  return error ? Response.json({ error: "Não consegui trocar o PIN." }, { status: 500 }) : Response.json({ ok: true });
}
