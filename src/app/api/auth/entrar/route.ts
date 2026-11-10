import { createClient } from "@/lib/supabase/server";
import { validCPF, validPIN } from "@/lib/cpf";
import { cpfEmail, derivePassword, guardKey, serverKey } from "@/lib/pin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { cpf?: string; pin?: string; token?: string };
  const pin = body.pin ?? "";
  let cpf = body.cpf ?? "";
  if (body.token) {
    if (!/^[0-9a-f-]{36}$/i.test(body.token)) return Response.json({ error: "Link inválido." }, { status: 400 });
    const sb = await createClient();
    const { data } = await sb.rpc("access_link_resolve", { p_server_key: serverKey(), p_token: body.token });
    if (!data) return Response.json({ error: "Este link expirou. Entre com o seu CPF ou peça um link novo." }, { status: 410 });
    cpf = (data as { cpf: string }).cpf;
  }
  if (!validCPF(cpf)) return Response.json({ error: "CPF inválido." }, { status: 400 });
  if (!validPIN(pin)) return Response.json({ error: "O PIN tem 4 números." }, { status: 400 });
  const supabase = await createClient();
  const key = guardKey("login", cpf);
  const { data: g } = await supabase.rpc("login_guard", { p_server_key: serverKey(), p_key: key, p_event: "check" });
  if ((g as { locked?: boolean })?.locked) return Response.json({ error: "Muitas tentativas. Espere 15 minutos ou redefina o PIN com CPF e telefone." }, { status: 429 });

  const { data, error } = await supabase.auth.signInWithPassword({ email: cpfEmail(cpf), password: derivePassword(cpf, pin) });
  if (error || !data.user) {
    const { data: f } = await supabase.rpc("login_guard", { p_server_key: serverKey(), p_key: key, p_event: "fail" });
    if ((f as { locked?: boolean })?.locked) return Response.json({ error: "Muitas tentativas. Espere 15 minutos ou redefina o PIN com CPF e telefone." }, { status: 429 });
    return Response.json({ error: "CPF ou PIN incorretos." }, { status: 401 });
  }
  await supabase.rpc("login_guard", { p_server_key: serverKey(), p_key: key, p_event: "ok" });
  const { data: prof } = await supabase.from("profiles").select("is_admin").eq("id", data.user.id).single();
  return Response.json({ ok: true, admin: !!prof?.is_admin });
}
