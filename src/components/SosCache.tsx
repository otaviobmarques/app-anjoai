"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Guarda no aparelho os contatos de emergência, para a tela SOS funcionar sem internet. */
export function SosCache() {
  useEffect(() => {
    createClient()
      .from("trusted_contacts")
      .select("name,phone,status")
      .neq("status", "recusado")
      .then(({ data }) => {
        if (!data) return;
        try {
          localStorage.setItem("anjo.sos.contacts", JSON.stringify(data.filter((c) => c.phone).map((c) => ({ name: c.name, phone: c.phone }))));
        } catch {}
      });
  }, []);
  return null;
}
