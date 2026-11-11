import { Inter, Space_Grotesk } from "next/font/google";
import { themeBootScript } from "@/lib/theme";
import RegisterServiceWorker from "./register-sw";
import ThemeWatcher from "./theme-watcher";
import Toaster from "./toaster";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
// Titles and big numbers, like the SubTrack extension.
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], weight: ["500", "600"] });

export const metadata = {
  title: { default: "Subtrack", template: "%s · Subtrack" },
  description: "Gastos mensuales, internet compartido y gastos en videojuegos.",
  appleWebApp: { capable: true, title: "Subtrack", statusBarStyle: "default" },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d0e" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${grotesk.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-dvh font-sans">
        {children}
        <Toaster />
        <ThemeWatcher />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
