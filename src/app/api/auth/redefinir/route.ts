import { createClient } from "@/lib/supabase/server";
import { onlyDigits, validCPF } from "@/lib/cpf";
import { cpfEmail, derivePassword, guardKey, randomPIN, serverKey } from "@/lib/pin-auth";

export const runtime = "nodejs";

// Esqueci o PIN: CPF + telefone cadastrado -> PIN novo exibido na hora (e já entra)
export async function POST(req: Request) {
  const { cpf = "", phone = "" } = (await req.json().catch(() => ({}))) as { cpf?: string; phone?: string };
  if (!validCPF(cpf)) return Response.json({ error: "CPF inválido." }, { status: 400 });
  if (onlyDigits(phone).length < 10) return Response.json({ error: "Coloque o telefone com DDD." }, { status: 400 });
  const supabase = await createClient();
  const key = guardKey("reset", cpf);
  const { data: g } = await supabase.rpc("login_guard", { p_server_key: serverKey(), p_key: key, p_event: "check" });
  if ((g as { locked?: boolean })?.locked) return Response.json({ error: "Muitas tentativas. Espere 15 minutos ou fale com a equipe do Anjo IA." }, { status: 429 });

  const pin = randomPIN();
  const { data } = await supabase.rpc("cpf_reset", { p_server_key: serverKey(), p_cpf: cpf, p_phone: phone, p_password: derivePassword(cpf, pin) });
  if (!(data as { ok?: boolean })?.ok) {
    await supabase.rpc("login_guard", { p_server_key: serverKey(), p_key: key, p_event: "fail" });
    return Response.json({ error: "CPF e telefone não conferem com nenhum cadastro." }, { status: 404 });
  }
  await supabase.rpc("login_guard", { p_server_key: serverKey(), p_key: key, p_event: "ok" });
  await supabase.rpc("login_guard", { p_server_key: serverKey(), p_key: guardKey("login", cpf), p_event: "ok" });
  await supabase.auth.signInWithPassword({ email: cpfEmail(cpf), password: derivePassword(cpf, pin) });
  return Response.json({ ok: true, pin });
}
