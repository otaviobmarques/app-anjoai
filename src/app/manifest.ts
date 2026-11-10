import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Anjo IA",
    short_name: "Anjo IA",
    description: "Asas de luz para o seu dia a dia. Conselheiro cristão de bolso: conversa por voz, orações e apoio nos dias difíceis.",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["lifestyle", "health"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Conversar", short_name: "Conversar", description: "Falar com o Anjo", url: "/conversa", icons: [{ src: "/icons/shortcut-conversa.png", sizes: "96x96" }] },
      { name: "Conversar por voz", short_name: "Voz", url: "/conversa?voz=1", icons: [{ src: "/icons/shortcut-conversa.png", sizes: "96x96" }] },
      { name: "SOS — ajuda agora", short_name: "SOS", url: "/sos", icons: [{ src: "/icons/shortcut-conversa.png", sizes: "96x96" }] },
    ],
    screenshots: [
      { src: "/screens/inicio.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Tela inicial com a palavra do dia" },
      { src: "/screens/conversa.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Conversa com o Anjo" },
      { src: "/screens/voz.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "Modo voz" },
      { src: "/screens/sos.png", sizes: "780x1688", type: "image/png", form_factor: "narrow", label: "SOS: ajuda imediata, mesmo sem internet" },
    ],
  };
}
