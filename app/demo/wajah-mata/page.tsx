import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/Logo";
import { FaceLandmarkDemo } from "@/features/learning/gaze/face-landmark-demo";
import { ROUTES } from "@/lib/routes";
import { FontSelector } from "@/components/accessibility/FontSelector";
import "@/features/learning/gaze/face-demo.css";

export const metadata: Metadata = {
  title: "Demo Titik Wajah dan Mata",
  robots: { index: false },
};

export default function FaceDemoPage() {
  return (
    <main className="face-demo-page" id="main">
      <header>
        <Logo />
        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
          <Link className="progress-link" href={ROUTES.learningDemo}>
            ← Kembali ke demo belajar
          </Link>
          <FontSelector />
        </div>
      </header>
      <div className="face-demo-intro">
        <h1>Demo Titik Wajah dan Mata</h1>
        <p>
          Lihat cara model menemukan kontur wajah, kelopak mata, dan iris secara
          langsung. Cukup aktifkan kamera untuk mulai menjelaskan.
        </p>
      </div>
      <FaceLandmarkDemo />
      <footer>
        <Link
          className="progress-link"
          href="/child/demo/belajar/latihan/pola-membaca"
        >
          Lanjut ke Eksperimen Pola Membaca →
        </Link>
      </footer>
    </main>
  );
}
