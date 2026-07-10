import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nous Deux — Compte commun",
    short_name: "Nous Deux",
    description: "Suivi des dépenses, budgets, factures et répartition du compte commun.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a12",
    theme_color: "#8b5cf6",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
