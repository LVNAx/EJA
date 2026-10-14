"use client";

import { useAppState, useBrowserReady } from "@/features/learning/state/store";
import { evidenceStatus } from "@/features/learning/state/evidence";
import { lessonById } from "@/features/learning/math/content";

/** Real observations from this browser; deliberately separate from database demo data. */
export function LearningSupportReport({ childId }: { childId: string }) {
  const state = useAppState(childId);
  const ready = useBrowserReady();
  const sessions = Object.values(state.sessions)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 10);
  return (
    <section
      className="card flex flex-col gap-4 p-5 sm:p-6"
      aria-labelledby="support-report-title"
    >
      <h2 id="support-report-title" className="text-2xl font-bold">
        Catatan latihan dan bantuan
      </h2>
      <p className="text-neutral-700">
        Lihat bagian yang sudah dicoba dan bantuan yang digunakan. Catatan
        berasal dari browser pada perangkat ini dan belum tersinkron ke
        perangkat lain.
      </p>
      {!ready ? (
        <p role="status">Memuat catatan latihan...</p>
      ) : !sessions.length ? (
        <p>
          Belum ada latihan pada perangkat ini. Catatan akan muncul setelah anak
          mencoba membaca, menulis, atau matematika.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {sessions.map((session) => {
            const evidence = state.evidence[session.id];
            const lesson =
              session.kind === "math" ? lessonById(session.activityId) : null;
            return (
              <li
                key={session.id}
                className="rounded-2xl border border-brand-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold">{session.title}</h3>
                  <span className="text-sm text-neutral-600">
                    {session.completedAt
                      ? "Latihan tersimpan"
                      : (
                            session.kind === "math"
                              ? state.lessons[session.activityId]
                                  ?.activeSessionId === session.id
                              : state.activePractices[session.kind] ===
                                session.id
                          )
                        ? "Sedang berlatih"
                        : "Belum diselesaikan"}
                  </span>
                </div>
                <p className="mt-2 font-semibold text-brand-700">
                  {evidenceStatus(session.kind, evidence)}
                </p>
                {evidence && (
                  <>
                    <p className="mt-2 text-neutral-700">
                      Pemutaran contoh: {evidence.audioPlays} kali · Petunjuk
                      ditampilkan: {evidence.hints} kali.
                    </p>
                    {Object.entries(evidence.quizzes).map(([id, quiz]) => (
                      <p key={id} className="mt-2 text-neutral-700">
                        {lesson?.chunks.find((chunk) => chunk.id === id)
                          ?.title ?? "Pertanyaan"}
                        : {quiz.attempts} percobaan, {quiz.incorrect} jawaban
                        belum tepat.{" "}
                        {quiz.solved
                          ? "Sudah menemukan jawaban yang tepat."
                          : "Masih perlu latihan."}
                      </p>
                    ))}
                    {evidence.writingScores.length > 0 && (
                      <p className="mt-2 text-neutral-700">
                        Kecocokan bentuk pada percobaan terakhir:{" "}
                        {evidence.writingScores.at(-1)}%. Ada{" "}
                        {evidence.writingScores.length} percobaan yang disimpan
                        atau diulang. Nilai ini mengukur kemiripan garis dengan
                        contoh.
                      </p>
                    )}
                    {evidence.readingAttempts > 0 && (
                      <p className="mt-2 text-neutral-700">
                        Kata terdeteksi sesuai pada {evidence.readingMatches}{" "}
                        dari {evidence.readingAttempts} percobaan mikrofon.
                        Hasil pengenalan suara dipengaruhi perangkat dan
                        lingkungan; ini tidak mengukur kemampuan membaca secara
                        menyeluruh.
                      </p>
                    )}
                    {evidence.selfRead && (
                      <p className="mt-2 text-neutral-700">
                        Anak menandai sudah berlatih membaca. Latihan mandiri
                        perlu diamati bersama pendamping.
                      </p>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-sm text-neutral-600">
        Gunakan catatan ini untuk memilih contoh yang perlu diulang bersama
        anak. Bintang adalah apresiasi usaha.
      </p>
    </section>
  );
}
