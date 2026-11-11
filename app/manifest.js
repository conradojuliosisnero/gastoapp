export default function manifest() {
  return {
    name: "GastoApp",
    short_name: "GastoApp",
    description: "Gastos mensuales, internet compartido y gastos en videojuegos.",
    lang: "es",
    start_url: "/inicio",
    display: "standalone",
    background_color: "#f2f2f7",
    theme_color: "#f2f2f7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
