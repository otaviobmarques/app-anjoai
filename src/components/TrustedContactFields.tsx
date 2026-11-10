"use client";

export const RELATIONS = ["Mãe", "Pai", "Cônjuge", "Filho(a)", "Irmão(ã)", "Amigo(a)", "Outro"];
export type TrustedContact = { name: string; phone: string; relation: string };
export const emptyTrusted: TrustedContact = { name: "", phone: "", relation: "" };

export function trustedError(c: TrustedContact) {
  if (!c.name.trim()) return "Diga o nome do seu Anjo da Guarda.";
  if (c.phone.replace(/\D/g, "").length < 10) return "Coloque o WhatsApp do seu Anjo da Guarda, com DDD.";
  return "";
}

/** "Seu Anjo da Guarda": internamente é o contato de emergência da Rede de Cuidado. */
export function TrustedContactFields({ value, onChange }: { value: TrustedContact; onChange: (c: TrustedContact) => void }) {
  return (
    <fieldset className="space-y-3">
      <legend className="font-bold">Seu Anjo da Guarda 👼</legend>
      <p className="-mt-1 text-sm text-muted">Alguém em quem você confia muito.</p>
      <input className="field" placeholder="Nome do seu Anjo da Guarda" value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} autoComplete="off" />
      <input className="field" type="tel" inputMode="tel" placeholder="WhatsApp dele(a), com DDD" value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value })} autoComplete="off" />
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Quem é essa pessoa">
        {RELATIONS.map((r) => (
          <button type="button" key={r} role="radio" aria-checked={value.relation === r} onClick={() => onChange({ ...value, relation: r })}
            className={`rounded-full px-3 py-2 text-sm ${value.relation === r ? "bg-gold font-bold text-on-gold" : "border border-line"}`}>{r}</button>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted">Só falamos com o seu Anjo da Guarda se você pedir ajuda ou se percebermos que você está passando por um momento muito difícil. Ele(a) nunca vê suas conversas.</p>
    </fieldset>
  );
}

export async function saveTrusted(c: TrustedContact) {
  const r = await fetch("/api/rede", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "pessoa", name: c.name.trim(), phone: c.phone, relation: c.relation || null, consent: true }),
  });
  if (r.ok) return "";
  const j = await r.json().catch(() => ({}));
  return (j.error as string) || "Não consegui salvar o seu Anjo da Guarda.";
}
