"use client";
import { useState } from "react";

type R = { ok: boolean; error?: string; results?: Record<string, { ok: boolean; ms: number; error?: string }> };

export function AiTestButton() {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<R | null>(null);
  async function test() {
    setBusy(true);
    const r = await fetch("/api/admin/teste-ia", { method: "POST" });
    setRes(await r.json().catch(() => ({ ok: false, error: `HTTP ${r.status}` })));
    setBusy(false);
  }
  return (
    <div className="space-y-2">
      <button className="btn-ghost text-sm" onClick={test} disabled={busy}>{busy ? "Testando…" : "Testar conexão"}</button>
      {res && (
        <ul className="text-sm">
          {res.error && <li className="text-danger">{res.error}</li>}
          {Object.entries(res.results ?? {}).map(([m, r]) => (
            <li key={m} className={r.ok ? "text-gold-text" : "text-danger"}>{m}: {r.ok ? `ok (${r.ms} ms)` : r.error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
