"use client";
import { createClient } from "@/lib/supabase/client";

function b64ToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export type PushState = "indisponivel" | "precisa-instalar" | "negado" | "desligado" | "ligado";

export async function pushState(): Promise<PushState> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    const iOS = typeof navigator !== "undefined" && /iPhone|iPad/.test(navigator.userAgent);
    return iOS ? "precisa-instalar" : "indisponivel";
  }
  if (Notification.permission === "denied") return "negado";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub ? "ligado" : "desligado";
}

/** Pede permissão e guarda a inscrição. Precisa ser chamado num toque. */
export async function enablePush(): Promise<PushState> {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) return "indisponivel";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "negado" : "desligado";
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) }));
  const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "desligado";
  await supabase.from("push_subscriptions").delete().eq("endpoint", j.endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({ user_id: user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth });
  return error ? "desligado" : "ligado";
}
