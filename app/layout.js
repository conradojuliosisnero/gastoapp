import { Inter } from "next/font/google";
import RegisterServiceWorker from "./register-sw";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata = {
  title: { default: "GastoApp", template: "%s · GastoApp" },
  description: "Gastos mensuales, internet compartido y gastos en videojuegos.",
  appleWebApp: { capable: true, title: "GastoApp", statusBarStyle: "default" },
};

export const viewport = {
  themeColor: "#f2f2f7",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
