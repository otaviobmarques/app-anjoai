import { getSession } from "@/lib/supabase/server";
import { derivePassword, randomPIN, serverKey } from "@/lib/pin-auth";

export const runtime = "nodejs";

// Equipe gera um PIN novo para quem esqueceu
export async function POST(req: Request) {
  const { supabase, user, profile } = await getSession();
  if (!user || !profile?.is_admin) return new Response("proibido", { status: 403 });
  const { userId } = (await req.json().catch(() => ({}))) as { userId?: string };
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return Response.json({ error: "pessoa inválida" }, { status: 400 });
  const { data: cpf } = await supabase.rpc("admin_person_cpf", { p_user: userId });
  if (!cpf) return Response.json({ error: "Esta pessoa não usa login por CPF." }, { status: 400 });
  const pin = randomPIN();
  const { error } = await supabase.rpc("cpf_set_password", { p_server_key: serverKey(), p_user: userId, p_password: derivePassword(cpf as string, pin), p_by_admin: user.id });
  return error ? Response.json({ error: "Não consegui gerar." }, { status: 500 }) : Response.json({ pin });
}
