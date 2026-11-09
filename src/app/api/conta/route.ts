import { getSession } from "@/lib/supabase/server";

export const runtime = "nodejs";

// RF25: exportação dos dados da própria pessoa
export async function GET() {
  const { supabase, user, profile } = await getSession();
  if (!user) return new Response("não autenticado", { status: 401 });
  const tables = ["conversations", "messages", "journey_memory", "prayers", "prayer_requests", "trusted_contacts", "risk_events", "alerts", "consents"];
  const out: Record<string, unknown> = { exportado_em: new Date().toISOString(), email: user.email, perfil: profile };
  for (const t of tables) {
    const { data } = await supabase.from(t).select("*");
    out[t] = data ?? [];
  }
  return new Response(JSON.stringify(out, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="anjo-ia-meus-dados.json"' },
  });
}

// RF25: exclusão de todos os dados (a conta de login é removida pela RPC delete_my_account)
export async function DELETE() {
  const { supabase, user } = await getSession();
  if (!user) return new Response("não autenticado", { status: 401 });
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return Response.json({ error: "Não consegui excluir a conta." }, { status: 500 });
  await supabase.auth.signOut();
  return Response.json({ ok: true });
}
