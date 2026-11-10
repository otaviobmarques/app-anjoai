import Link from "next/link";
import { SosButton } from "./SosButton";
import { SosCache } from "./SosCache";

const NAV = [
  { href: "/inicio", label: "Início", icon: "M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/conversa", label: "Conversar", icon: "M4 5h16v11H8l-4 4z" },
  { href: "/oracoes", label: "Orações", icon: "M12 3v6m0 0c-3 2-5 6-5 9h10c0-3-2-7-5-9z" },
  { href: "/paz", label: "Paz", icon: "M12 21c-4-3-8-6-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-4 8-8 11z" },
  { href: "/rede", label: "Rede", icon: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 3-5 6-5s6 2 6 5m2-5c3 0 6 2 6 5" },
];

export function AppShell({ children, active }: { children: React.ReactNode; active: string }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <main className="flex-1 px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">{children}</main>
      <SosButton />
      <SosCache />
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex max-w-xl justify-around">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className={`flex min-h-14 min-w-14 flex-col items-center justify-center gap-1 px-2 text-xs ${active === n.href ? "text-gold-text font-bold" : "text-muted"}`} aria-current={active === n.href ? "page" : undefined}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden><path d={n.icon} /></svg>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
