import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "EJA — Ekosistem Belajar Disleksia",
  description: "Skrining dan belajar yang ramah anak disleksia untuk siswa SD Indonesia.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#DDD5FF" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={outfit.variable}>
      <body>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
