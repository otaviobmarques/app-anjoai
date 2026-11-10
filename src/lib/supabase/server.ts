import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // chamado de um Server Component: o middleware cuida da renovação
          }
        },
      },
    },
  );
}

export type Profile = {
  id: string;
  name: string | null;
  tradition: "evangelica" | "catolica" | "geral";
  bible_version: string;
  angel_theme: "marca" | "asas" | "aureola";
  color_mode: "auto" | "escuro" | "claro";
  voice_replies: boolean;
  word_time: string | null;
  plan: "gratuito" | "pago";
  is_admin: boolean;
  terms_version: string | null;
  adult_confirmed: boolean;
  phone: string | null;
  must_change_password: boolean;
};

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  return { supabase, user, profile };
}

/**
 * Para as telas principais do app: exige login, termos aceitos, senha definitiva
 * e pelo menos um contato de emergência. O SOS fica fora disso e sempre abre.
 */
export async function requireReady(path: string) {
  const s = await getSession();
  if (!s.user) redirect(`/entrar?next=${encodeURIComponent(path)}`);
  if (!s.profile?.terms_version || !s.profile.adult_confirmed) redirect(`/boas-vindas?next=${encodeURIComponent(path)}`);
  if (s.profile.must_change_password) redirect(`/trocar-senha?next=${encodeURIComponent(path)}`);
  const { count } = await s.supabase.from("trusted_contacts").select("id", { count: "exact", head: true }).neq("status", "recusado");
  if (!count) redirect(`/contato-emergencia?next=${encodeURIComponent(path)}`);
  return s as typeof s & { user: NonNullable<typeof s.user>; profile: Profile };
}
