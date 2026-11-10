import { getSession } from "@/lib/supabase/server";
import { serverKey } from "@/lib/pin-auth";

export const runtime = "nodejs";

// Gera um novo link de acesso (30 dias) para uma pessoa já cadastrada
export async function POST(req: Request) {
  const { supabase, user, profile } = await getSession();
  if (!user || !profile?.is_admin) return new Response("proibido", { status: 403 });
  const { userId } = (await req.json().catch(() => ({}))) as { userId?: string };
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return Response.json({ error: "pessoa inválida" }, { status: 400 });
  const { data, error } = await supabase.rpc("access_link_create", { p_server_key: serverKey(), p_admin: user.id, p_user: userId });
  if (error || !data) return Response.json({ error: /sem cpf/.test(error?.message ?? "") ? "Esta pessoa não usa login por CPF." : "Não consegui gerar o link." }, { status: 400 });
  return Response.json({ link: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.anjoia.com.br"}/acesso/${data}` });
}
