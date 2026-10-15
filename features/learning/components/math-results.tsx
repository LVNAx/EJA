"use client";
import Link from "next/link";
import { useAppState, useBrowserReady } from "../state/store";
import { mathResults } from "../model/math-results";
import { learningHref } from "../paths";
import "../styles/progress.css";

export function MathResults({ childId }: { childId: string }) {
  const state = useAppState(childId);
  const ready = useBrowserReady();
  if (!ready) return <p role="status">Memuat hasil matematika…</p>;
  return (
    <section
      className="practice-math-results"
      aria-label="Hasil latihan matematika"
    >
      <h2>Latihan matematika</h2>
      <p className="progress-caption">
        Sesi selesai terbaru pada browser ini. Nilai = soal tepat pada percobaan
        pertama ÷ soal dinilai × 100.
      </p>
      <div className="progress-skill-grid">
        {mathResults(state).map((result) => (
          <article className="progress-skill" key={result.id}>
            <h3>{result.title}</h3>
            {result.score === null ? (
              <p>Belum ada kuis yang dinilai.</p>
            ) : (
              <>
                <p className="practice-score">
                  <strong>{result.score}</strong> / 100
                  {result.assessed < result.total ? " · sementara" : ""}
                </p>
                <p>
                  {result.firstTry} dari {result.assessed} soal tepat pada
                  percobaan pertama.
                </p>
                <p className="progress-caption">
                  {result.solved} soal akhirnya selesai · {result.attempts}{" "}
                  percobaan · {result.hints} petunjuk
                </p>
                <p className="progress-caption">
                  {result.assessed} dari {result.total} soal dinilai ·{" "}
                  {new Date(result.at!).toLocaleDateString("id-ID", {
                    timeZone: "Asia/Jakarta",
                  })}
                </p>
                <p>
                  {result.firstTry < result.assessed
                    ? result.id === "pecahan-dasar"
                      ? "Ulangi gambar bagian yang sama besar sebelum kuis berikutnya."
                      : "Hitung isi setiap kelompok, lalu jumlahkan bersama."
                    : "Coba contoh lain bersama pendamping."}
                </p>
              </>
            )}
            <Link
              className="progress-link"
              href={learningHref(childId, result.path)}
            >
              {result.score === null ? "Mulai latihan" : "Latih lagi"}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
