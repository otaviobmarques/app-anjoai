"use client";
import { useState } from "react";
import { EMERGENCY } from "@/lib/emergency";

export function CrisisCard({ alreadyAlerted }: { alreadyAlerted?: { sent: number; total: number } | null }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(alreadyAlerted ? "done" : "idle");
  const [msg, setMsg] = useState(alreadyAlerted ? resumo(alreadyAlerted) : "");

  async function avisar() {
    setState("sending");
    try {
      const r = await fetch("/api/sos", { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setState("done");
      setMsg(resumo(j));
    } catch (e) {
      setState("error");
      setMsg(e instanceof Error && e.message ? e.message : "Não consegui avisar agora. Ligue 188.");
    }
  }

  return (
    <div role="alert" className="rounded-2xl border-2 border-danger bg-danger-bg p-4">
      <p className="font-bold">Você não está sozinho(a). Fale com alguém agora:</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {EMERGENCY.slice(0, 2).map((e) => (
          <a key={e.number} href={`tel:${e.number}`} className="flex min-h-14 flex-col items-center justify-center rounded-xl bg-[#c62828] p-2 text-center font-bold text-white">
            <span className="text-xl">{e.number}</span>
            <span className="text-xs font-medium">{e.label.split(" — ")[0]}</span>
          </a>
        ))}
      </div>
      <button className="btn-ghost mt-3 w-full" onClick={avisar} disabled={state === "sending" || state === "done"}>
        {state === "sending" ? "Avisando…" : state === "done" ? "Rede de Cuidado avisada" : "Avisar minha Rede de Cuidado"}
      </button>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </div>
  );
}

function resumo(r: { sent: number; total: number }) {
  if (r.total === 0) return "Você ainda não tem contato confirmado na Rede de Cuidado. Ligue 188 ou chame alguém perto de você.";
  if (r.sent === 0) return "Registramos o pedido, mas o e-mail não saiu. Ligue para alguém de confiança ou para o 188.";
  return `Avisamos ${r.sent} ${r.sent === 1 ? "pessoa" : "pessoas"} da sua Rede de Cuidado.`;
}
