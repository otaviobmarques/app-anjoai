"use client";
/** Campo de PIN de 4 números (teclado numérico no celular). */
export function PinInput({ value, onChange, label, autoComplete = "current-password" }: { value: string; onChange: (v: string) => void; label: string; autoComplete?: string }) {
  return (
    <input
      className="field text-center font-mono text-2xl tracking-[0.6em]"
      type="password"
      inputMode="numeric"
      pattern="\d{4}"
      maxLength={4}
      placeholder="••••"
      aria-label={label}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
    />
  );
}
