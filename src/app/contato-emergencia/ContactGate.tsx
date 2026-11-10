"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmergencyContactForm } from "@/components/EmergencyContactForm";

export function ContactGate({ next }: { next: string }) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-10">
      <div className="angel mx-auto h-20 w-20" aria-hidden />
      <h1 className="text-center text-2xl font-extrabold">Seu contato de emergência</h1>
      <p className="text-center text-muted">Para usar o Anjo IA, cadastre pelo menos uma pessoa que possa ser avisada se você precisar de ajuda. Pode ser alguém da família, um amigo, sua psicóloga ou seu pastor.</p>
      <div className="card p-4"><EmergencyContactForm onSaved={() => { router.replace(next); router.refresh(); }} /></div>
      <Link href="/sos" className="block text-center text-sm text-danger underline">Precisa de ajuda agora? Abrir SOS</Link>
    </div>
  );
}
