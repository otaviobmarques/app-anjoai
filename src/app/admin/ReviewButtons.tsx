"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ReviewButtons({ id }: { id: string }) {
  const router = useRouter();
  async function mark(status: "revisado" | "falso_alarme") {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("risk_events").update({ review_status: status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    router.refresh();
  }
  return (
    <div className="flex gap-2">
      <button className="rounded-full border border-line px-3 py-1.5 text-xs" onClick={() => mark("revisado")}>Revisado</button>
      <button className="rounded-full border border-line px-3 py-1.5 text-xs" onClick={() => mark("falso_alarme")}>Falso alarme</button>
    </div>
  );
}
