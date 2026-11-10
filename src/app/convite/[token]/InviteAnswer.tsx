"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function InviteAnswer({ token, status: s0, linked, loggedIn, email }: { token: string; status: string; linked: boolean; loggedIn: boolean; email: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState(s0);
  const [err, setErr] = useState("");
  const next = encodeURIComponent(`/convite/${token}`);

  async function answer(accept: boolean) {
    const { data } = await createClient().rpc("answer_invite", { p_token: token, p_accept: accept });
    if (data === "proprio") return setErr("Este convite é seu. Envie o link para a pessoa que vai te acompanhar.");
    if (typeof data === "string" && data !== "invalido") {
      setStatus(data);
      if (data === "confirmado") router.push("/cuidando");
    }
  }

  if (status === "recusado") return <p className="mt-6 rounded-xl bg-surface-2 p-4 text-center">Tudo bem. Você não vai receber avisos.</p>;
  if (status === "confirmado" && linked) return (
    <div className="mt-6 space-y-3 text-center">
      <p className="rounded-xl bg-surface-2 p-4">Obrigado por cuidar. Você já está na Rede de Cuidado.</p>
      <Link href="/cuidando" className="btn-gold inline-flex">Ver pessoas que acompanho</Link>
    </div>
  );

  if (!loggedIn) return (
    <div className="mt-6 space-y-2">
      <p className="text-sm text-muted">Para receber os avisos, entre ou crie sua conta no Anjo IA. Leva um minuto.</p>
      <Link href={`/entrar?next=${next}&modo=cadastro`} className="btn-gold flex w-full justify-center">Criar conta e aceitar</Link>
      <Link href={`/entrar?next=${next}`} className="btn-ghost flex w-full justify-center">Já tenho conta</Link>
      <button className="w-full py-2 text-sm text-muted underline" onClick={() => answer(false)}>Não quero participar</button>
    </div>
  );

  return (
    <div className="mt-6 space-y-2">
      <p className="text-sm text-muted">Você vai aceitar com a conta {email}.</p>
      <button className="btn-gold w-full" onClick={() => answer(true)}>Aceito fazer parte</button>
      <button className="btn-ghost w-full" onClick={() => answer(false)}>Agora não</button>
      {err && <p className="text-sm text-danger">{err}</p>}
    </div>
  );
}
