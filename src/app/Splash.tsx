"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Splash({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.replace(to), 1400);
    return () => clearTimeout(t);
  }, [router, to]);
  return null;
}
