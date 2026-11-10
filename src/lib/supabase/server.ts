import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
