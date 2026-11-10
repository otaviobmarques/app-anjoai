"use client";
import { useState } from "react";
import { playRecorded, speak, stopSpeaking } from "@/lib/voice";

export function SpeakButton({ text, label = "Ouvir", src, big = false }: { text: string; label?: string; src?: string; big?: boolean }) {
  const [on, setOn] = useState(false);
  return (
    <button
      className={big ? "btn-gold w-full" : "rounded-full border border-line px-3 py-1.5 text-xs"}
      onClick={() => {
        if (on) { stopSpeaking(); setOn(false); return; }
        setOn(true);
        if (src) playRecorded(src, text, () => setOn(false));
        else speak(text, () => setOn(false));
      }}
      aria-pressed={on}
    >
      {on ? "Parar" : label}
    </button>
  );
}
