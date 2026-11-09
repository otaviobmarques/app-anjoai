"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function InviteAnswer({ token, status: s0 }: { token: string; status: string }) {
  const [status, setStatus] = useState(s0);
  async function answer(accept: boolean) {
    const { data } = await createClient().rpc("answer_invite", { p_token: token, p_accept: accept });
    if (typeof data === "string" && data !== "invalido") setStatus(data);
  }
  if (status === "confirmado") return <p className="mt-6 rounded-xl bg-surface-2 p-4 text-center">Obrigado por cuidar. Você está na Rede de Cuidado.</p>;
  if (status === "recusado") return <p className="mt-6 rounded-xl bg-surface-2 p-4 text-center">Tudo bem. Você não vai receber avisos.</p>;
  return (
    <div className="mt-6 space-y-2">
      <button className="btn-gold w-full" onClick={() => answer(true)}>Aceito fazer parte</button>
      <button className="btn-ghost w-full" onClick={() => answer(false)}>Agora não</button>
    </div>
  );
}
