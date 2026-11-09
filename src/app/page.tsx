import { LogoCompleto } from "@/components/Logo";
import { Splash } from "./Splash";
import { createClient } from "@/lib/supabase/server";

export default async function Abertura() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-4" style={{ ["--bg" as string]: "#000" }}>
      <div className="relative splash">
        <div className="absolute -inset-16 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(254,199,52,.28), transparent 75%)" }} />
        <div className="relative"><LogoCompleto width={280} /></div>
      </div>
      <p className="mt-6 text-center text-sm text-[#bdb5a4]">Asas de luz para o seu dia a dia.</p>
      <Splash to={user ? "/inicio" : "/entrar"} />
    </div>
  );
}
