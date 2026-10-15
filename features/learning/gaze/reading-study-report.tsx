"use client";
import Link from "next/link";
import { learningHref } from "../paths";
import {
  readingStudyAdvice,
  studyRoundResult,
  type ReadingStudy,
} from "./reading-study";
import { useReadingStudies } from "./study-store";

export function ReadingStudyReport({
  record,
  childId,
}: {
  record: ReadingStudy;
  childId: string;
}) {
  const advice = readingStudyAdvice(record);
  return (
    <section className="study-report" aria-label="Hasil pola membaca">
      <header>
        <h2>Hasil pola membaca</h2>
        <p>
          Dua hal dicatat terpisah: jawaban pemahaman dan perkiraan pandangan.
        </p>
      </header>
      <div className="study-round-grid">
        {record.rounds.map((round) => {
          const r = studyRoundResult(round),
            o = round.observation;
          return (
            <article key={round.passageId} className="study-round-card">
              <h3>
                {r.passage.guided ? "Dengan panduan bagian" : "Bacaan biasa"}
              </h3>
              <p className="study-score">
                {r.score === null
                  ? "—"
                  : `${r.score} / 100${r.assessed < 2 ? " · sementara" : ""}`}
              </p>
              <p>
                {r.correct} dari {r.assessed} jawaban sesuai · {r.assessed} dari
                2 dinilai
              </p>
              <p>
                {r.oralAssessed
                  ? `${r.oralCorrect} dari ${r.oralAssessed} bagian dibaca sesuai menurut pendamping`
                  : "Bacaan lisan belum dinilai pendamping"}
              </p>
              <p>
                {(o.durationMs / 1000).toFixed(1).replace(".", ",")} detik
                membaca{round.assisted ? " · dibantu" : ""}
              </p>
              {o.usable ? (
                <>
                  <p>
                    <strong>{o.returns}</strong> perkiraan perpindahan ke bagian
                    sebelumnya
                  </p>
                  <table>
                    <caption>
                      Waktu yang terpetakan, bukan durasi fiksasi
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Bagian</th>
                        <th scope="col">Waktu</th>
                        <th scope="col">Kunjungan stabil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {o.regionMs.map((ms, i) => (
                        <tr key={i}>
                          <th scope="row">{i + 1}</th>
                          <td>
                            {(ms / 1000).toFixed(1).replace(".", ",")} dtk
                          </td>
                          <td>{o.visits[i]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="study-note">
                    {Math.round((o.mappedMs / o.durationMs) * 100)}% waktu
                    terpetakan ke bagian; posisi yang meragukan dilewati.
                  </p>
                </>
              ) : (
                <p className="study-note">{o.reason}</p>
              )}
            </article>
          );
        })}
      </div>
      {record.rounds.length === 2 && (
        <p className="study-note">
          Bacaan dan soal berbeda. Selisih hasil sesi ini belum membuktikan
          panduan lebih efektif. Ulangi pada contoh lain untuk melihat polanya.
        </p>
      )}
      <div className="study-advice">
        <h3>Latihan berikutnya</h3>
        <p>{advice.reason}</p>
        <p>{advice.support}</p>
        <p className="study-note">{advice.context}</p>
        <Link
          className="progress-button"
          href={learningHref(childId, advice.path)}
        >
          Latih bacaan pendek
        </Link>
      </div>
      <details>
        <summary>Jawaban dan batas pengamatan</summary>
        {record.rounds.map((round) => {
          const r = studyRoundResult(round);
          return (
            <div key={round.passageId}>
              <h3>{r.passage.title}</h3>
              {r.passage.questions.map((q, i) => (
                <p key={q.prompt}>
                  {q.prompt} ·{" "}
                  {round.answers[i] === null
                    ? "Belum dijawab"
                    : q.options[round.answers[i]!]}
                </p>
              ))}
            </div>
          );
        })}
        <p>
          Nilai = jawaban sesuai ÷ pertanyaan dinilai × 100. Pandangan
          dikelompokkan ke tiga bagian besar setelah pengecekan posisi. Webcam
          ini tidak mengukur fiksasi per kata, saccade, perhatian, atau risiko
          disleksia. Perpindahan ke bagian sebelumnya tidak selalu berarti
          kesulitan.
        </p>
      </details>
    </section>
  );
}

export function ReadingStudyHistory({ childId }: { childId: string }) {
  const records = useReadingStudies(childId);
  if (!records.length) return null;
  return (
    <details className="study-history">
      <summary>Hasil eksperimen membaca terakhir</summary>
      <p className="study-note">
        {new Date(records[0].completedAt).toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
        })}{" "}
        · Ringkasan tersimpan pada browser ini.
      </p>
      <ReadingStudyReport record={records[0]} childId={childId} />
    </details>
  );
}
