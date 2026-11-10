import webpush from "web-push";

let configured = false;
export function pushAvailable() {
  return Boolean(process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
}
function setup() {
  if (configured) return;
  webpush.setVapidDetails(process.env.NEXT_PUBLIC_APP_URL || "https://app.anjoia.com.br", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  configured = true;
}

export type PushTarget = { endpoint: string; p256dh: string; auth: string };

/** Envia a notificação. Retorna "ok", "expirada" (o navegador cancelou a inscrição) ou "erro". */
export async function sendPush(t: PushTarget, payload: { title: string; body: string; url: string; tag?: string }) {
  setup();
  try {
    await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, JSON.stringify(payload), { TTL: 3600, urgency: "high" });
    return "ok" as const;
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    return code === 404 || code === 410 ? ("expirada" as const) : ("erro" as const);
  }
}
