import { createClient } from "@/lib/supabase/server";
import { onlyDigits, validCPF, validPIN } from "@/lib/cpf";
import { cpfEmail, derivePassword, serverKey } from "@/lib/pin-auth";
import { TERMS_VERSION } from "@/lib/terms";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as {
    name?: string; cpf?: string; phone?: string; pin?: string; agree?: boolean; caregiver?: boolean;
    contact?: { name?: string; phone?: string; relation?: string };
  };
  if (!b.name?.trim()) return Response.json({ error: "Diga o seu nome." }, { status: 400 });
  if (!validCPF(b.cpf ?? "")) return Response.json({ error: "Confira o seu CPF." }, { status: 400 });
  if (onlyDigits(b.phone ?? "").length < 10) return Response.json({ error: "Coloque o seu WhatsApp com DDD." }, { status: 400 });
  if (!validPIN(b.pin ?? "")) return Response.json({ error: "Crie um PIN de 4 números." }, { status: 400 });
  if (/^(\d)\1{3}$|^(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)$/.test(b.pin!)) return Response.json({ error: "Esse PIN é muito fácil. Escolha outro." }, { status: 400 });
  if (!b.agree) return Response.json({ error: "Confirme que tem 18 anos ou mais e aceita os termos." }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.rpc("cpf_signup", {
    p_server_key: serverKey(), p_name: b.name, p_cpf: b.cpf, p_phone: b.phone, p_password: derivePassword(b.cpf!, b.pin!), p_terms_version: TERMS_VERSION,
    p_contact_name: b.caregiver ? null : b.contact?.name ?? null, p_contact_phone: b.caregiver ? null : b.contact?.phone ?? null,
    p_contact_relation: b.caregiver ? null : b.contact?.relation || null, p_needs_contact: !b.caregiver,
  });
  if (error) {
    const m = error.message;
    const msg = /já cadastrado/.test(m) ? "Esse CPF já tem conta. Toque em “Já tenho conta”." : /anjo da guarda/.test(m) ? "Conte quem é o seu Anjo da Guarda (nome e WhatsApp)." : /muitos/.test(m) ? "Muitos cadastros agora. Tente em instantes." : "Não consegui criar a sua conta. Confira os dados.";
    return Response.json({ error: msg }, { status: 400 });
  }
  const { error: e2 } = await supabase.auth.signInWithPassword({ email: cpfEmail(b.cpf!), password: derivePassword(b.cpf!, b.pin!) });
  if (e2) return Response.json({ error: "Conta criada, mas não consegui entrar. Toque em “Já tenho conta”." }, { status: 500 });
  return Response.json({ ok: true });
}
