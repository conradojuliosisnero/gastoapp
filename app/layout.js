import { Inter } from "next/font/google";
import { themeBootScript } from "@/lib/theme";
import RegisterServiceWorker from "./register-sw";
import ThemeWatcher from "./theme-watcher";
import Toaster from "./toaster";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata = {
  title: { default: "GastoApp", template: "%s · GastoApp" },
  description: "Gastos mensuales, internet compartido y gastos en videojuegos.",
  appleWebApp: { capable: true, title: "GastoApp", statusBarStyle: "default" },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} antialiased`} suppressHydrationWarning>
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
