import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { openDyslexic } from "@/features/learning/font";
import { FontPreferenceSync } from "@/components/accessibility/FontSelector";
import "./globals.css";
import "@/features/learning/styles/progress.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "EJA - AI-Driven Early Detection and Personalized Learning for Children with Dyslexia", template: "%s - EJA" },
  description: "Skrining dan belajar yang ramah anak disleksia untuk siswa SD Indonesia.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#DDD5FF" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${outfit.variable} ${openDyslexic.variable}`}>
      <body>
        <FontPreferenceSync />
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
