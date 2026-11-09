import Link from "next/link";

export function SosButton() {
  return (
    <Link
      href="/sos"
      className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#c62828] font-extrabold text-white shadow-lg"
      style={{ bottom: "calc(5.25rem + env(safe-area-inset-bottom))" }}
      aria-label="SOS: ajuda imediata"
    >
      SOS
    </Link>
  );
}
