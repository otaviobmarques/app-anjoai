import { SosClient } from "./SosClient";

export const dynamic = "force-static";
export const metadata = { title: "SOS — Anjo IA" };

// Página estática: fica em cache no aparelho e abre mesmo sem internet.
export default function Sos() {
  return <SosClient />;
}
