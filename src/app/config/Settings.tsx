"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AngelArt, THEMES } from "@/components/AngelArt";
import type { Profile } from "@/lib/supabase/server";
import { InstallApp } from "@/components/InstallApp";

function setCookie(k: string, v: string) {
  document.cookie = `${k}=${v}; path=/; max-age=31536000; samesite=lax`;
}

export function Settings({ profile, email, memory }: { profile: Profile; email: string; memory: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [p, setP] = useState(profile);
  const [fs, setFs] = useState(() => (typeof document !== "undefined" ? document.documentElement.dataset.fs : "normal") || "normal");
  const [mem, setMem] = useState(memory);
  const [saved, setSaved] = useState("");

  async function update(patch: Partial<Profile>) {
    setP((x) => ({ ...x, ...patch }));
    await supabase.from("profiles").update(patch).eq("id", p.id);
    if (patch.color_mode) { setCookie("cm", patch.color_mode); document.documentElement.dataset.mode = patch.color_mode; }
    setSaved("Salvo");
    setTimeout(() => setSaved(""), 1500);
  }
  function setFont(v: string) {
    setFs(v); setCookie("fs", v); document.documentElement.dataset.fs = v;
  }
  async function clearMemory() {
    if (!confirm("Apagar tudo o que o Anjo lembra sobre você?")) return;
    await supabase.from("journey_memory").delete().eq("user_id", p.id);
    setMem("");
  }
  async function deleteAccount() {
    if (!confirm("Isso apaga sua conta e todos os seus dados para sempre. Continuar?")) return;
    const r = await fetch("/api/conta", { method: "DELETE" });
    if (r.ok) { router.replace("/entrar"); router.refresh(); } else alert("Não consegui excluir agora.");
  }
  async function logout() {
    await supabase.auth.signOut();
    router.replace("/entrar");
    router.refresh();
  }

  const Seg = <T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) => (
    <fieldset>
      <legend className="mb-2 text-sm text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={value === v} className={`rounded-full px-4 py-2 text-sm ${value === v ? "bg-gold font-bold text-on-gold" : "border border-line"}`}>{l}</button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">Ajustes</h1>
        <span className="text-xs text-gold-text" role="status">{saved}</span>
      </header>

      <section className="card space-y-4 p-4">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Nome</span>
          <input className="field" defaultValue={p.name ?? ""} onBlur={(e) => e.target.value !== (p.name ?? "") && update({ name: e.target.value })} />
        </label>
        <fieldset>
          <legend className="mb-2 text-sm text-muted">Anjo da tela inicial</legend>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => update({ angel_theme: t.id })} aria-pressed={p.angel_theme === t.id} className={`card flex flex-col items-center gap-2 p-3 text-xs ${p.angel_theme === t.id ? "border-gold" : ""}`}>
                <AngelArt theme={t.id} size={60} /><span className="font-bold">{t.name}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <Seg label="Aparência" value={p.color_mode} onChange={(v) => update({ color_mode: v })} options={[["auto", "Automático"], ["escuro", "Escuro"], ["claro", "Claro"]]} />
        <Seg label="Tamanho das letras" value={fs as "normal" | "grande" | "maior"} onChange={setFont} options={[["normal", "Normal"], ["grande", "Grande"], ["maior", "Maior"]]} />
      </section>

      <section className="card space-y-4 p-4">
        <Seg label="Tradição" value={p.tradition} onChange={(v) => update({ tradition: v })} options={[["evangelica", "Evangélica"], ["catolica", "Católica"], ["geral", "Geral"]]} />
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Versão da Bíblia preferida</span>
          <select className="field" value={p.bible_version} onChange={(e) => update({ bible_version: e.target.value })}>
            {["NVI", "ARA", "ARC", "NAA", "NTLH", "Ave-Maria", "CNBB", "Jerusalém"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label className="flex items-center justify-between gap-3">
          <span>Ouvir as respostas em voz</span>
          <input type="checkbox" className="h-6 w-6 accent-[var(--gold)]" checked={p.voice_replies} onChange={(e) => update({ voice_replies: e.target.checked })} />
        </label>
      </section>

      <InstallApp compact />

      <section className="card space-y-3 p-4">
        <h2 className="font-bold">O que o Anjo lembra de você</h2>
        <p className="whitespace-pre-wrap text-sm text-muted">{mem || "Ainda nada. A memória se forma com as conversas."}</p>
        {mem && <button className="btn-ghost text-sm" onClick={clearMemory}>Apagar memória</button>}
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-bold">Privacidade</h2>
        <p className="text-sm text-muted">Conta: {email}</p>
        <a href="/api/conta" className="btn-ghost flex justify-center text-sm">Baixar meus dados</a>
        <button className="btn-ghost w-full text-sm" onClick={logout}>Sair</button>
        <button className="w-full py-2 text-sm text-danger underline" onClick={deleteAccount}>Excluir minha conta e todos os dados</button>
      </section>

      <p className="text-center text-xs text-muted">Anjo IA · Fase 0 (testes) · não é serviço médico nem de emergência</p>
    </div>
  );
}
