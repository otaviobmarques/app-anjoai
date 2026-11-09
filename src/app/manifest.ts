import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Anjo IA",
    short_name: "Anjo IA",
    description: "Asas de luz para o seu dia a dia.",
    start_url: "/inicio",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    lang: "pt-BR",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
