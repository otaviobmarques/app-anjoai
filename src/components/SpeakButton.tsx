"use client";
import { useState } from "react";
import { speak, stopSpeaking } from "@/lib/voice";

export function SpeakButton({ text, label = "Ouvir" }: { text: string; label?: string }) {
  const [on, setOn] = useState(false);
  return (
    <button
      className="rounded-full border border-line px-3 py-1.5 text-xs"
      onClick={() => {
        if (on) { stopSpeaking(); setOn(false); return; }
        setOn(true);
        speak(text, () => setOn(false));
      }}
      aria-pressed={on}
    >
      {on ? "Parar" : label}
    </button>
  );
}
