import Link from "next/link";
import { type AssessmentRecord } from "@/lib/screening/assessment";
import {
  answerScore,
  buildAssessmentPlan,
} from "@/lib/screening/learning-plan";
import { learningHref } from "@/features/learning/paths";
import { MathResults } from "@/features/learning/components/math-results";
import { ReadingSessionReport } from "./ReadingSessionReport";
import {
  DICTATION_ITEMS,
  MEANING_ITEMS,
  READING_ITEMS,
  SOUND_ITEMS,
} from "@/lib/screening/protocol";

export function AssessmentReport({
  record,
  childId,
}: {
  record: AssessmentRecord;
  childId: string;
}) {
  const { tasks, next, camera } = buildAssessmentPlan(record);
  return (
    <section className="assessment-report">
      <div className="assessment-card-heading">
        <p className="assessment-kicker">Catatan pendamping · Tes versi 2</p>
        <h1>Hasil kegiatan</h1>
        <p>Nilai jawaban membantu memilih latihan berikutnya.</p>
      </div>
      <div className="assessment-result-grid">
        {tasks.map((task) => (
          <article className="assessment-result-card" key={task.key}>
            <h2>{task.title}</h2>
            <p className="assessment-result-number">
              {answerScore(task) ?? "—"}
            </p>
            <p>
              {task.assessed
                ? `dari 100${task.status === "partial" ? " · sementara" : ""}`
                : "Belum dinilai"}
            </p>
            {task.assessed > 0 && (
              <small>
                {task.correct} dari {task.assessed} jawaban sesuai
              </small>
            )}
            <small>
              {task.assessed} dari {task.total}{" "}
              {task.key === "naming" ? "angka" : "butir"} dinilai
            </small>
            {task.key === "naming" && task.durationMs !== null && (
              <small>
                {(task.durationMs / 1000).toFixed(1).replace(".", ",")} detik
                tercatat
              </small>
            )}
            {task.assisted > 0 && (
              <small>{task.assisted} jawaban dibantu</small>
            )}
            <p className="assessment-result-status">
              {task.status === "complete"
                ? "Catatan lengkap"
                : task.status === "partial"
                  ? "Catatan sebagian"
                  : "Perlu dicoba kembali"}
            </p>
          </article>
        ))}
      </div>
      <p className="assessment-helper">
        Nilai = jawaban sesuai ÷ butir dinilai × 100. Bagian yang dilewati tidak
        dianggap salah. Bacaan dan penyebutan angka diperiksa pendamping.
      </p>
      <section
        className="assessment-next"
        aria-label="Latihan berdasarkan hasil tes"
      >
        <p className="assessment-kicker">LATIHAN BERIKUTNYA</p>
        <h2>{next.label}</h2>
        <p>{next.reason}</p>
        <p>{next.instruction}</p>
        <Link
          className="assessment-primary"
          href={learningHref(childId, next.path)}
        >
          Buka latihan
        </Link>
      </section>
      <ReadingSessionReport record={record} />
      {camera && !record.submission.readingSession && (
        <section
          className="assessment-camera-result"
          aria-label="Analisis pendukung kamera"
        >
          <h2>Jawaban & pengamatan mata</h2>
          <div className="assessment-two">
            <div>
              <span>Nilai membaca</span>
              <strong>
                {answerScore(tasks[1]) === null
                  ? "Belum dinilai"
                  : `${answerScore(tasks[1])} / 100`}
              </strong>
              <small>
                {tasks[1].correct} sesuai · {tasks[1].assessed} dinilai dari{" "}
                {tasks[1].total} butir
              </small>
            </div>
            <div>
              <span>Sinyal mata terekam</span>
              <strong>{camera.coverage}% waktu</strong>
              <small>
                {(camera.observedMs / 1000).toFixed(1).replace(".", ",")} detik
                · {(camera.missingMs / 1000).toFixed(1).replace(".", ",")} detik
                tanpa sinyal
              </small>
            </div>
          </div>
          <p>{camera.advice}</p>
          <small>
            Pelacak iris ini belum mengukur kata yang dilihat, kesalahan bacaan,
            atau perhatian. Nilai dan latihan dipilih dari hasil pengerjaan.
          </small>
        </section>
      )}
      <MathResults childId={childId} />
      <details className="assessment-evidence">
        <summary>Lihat jawaban dan bantuan</summary>
        <ul>
          {record.submission.answers.map((answer) => {
            const sound = SOUND_ITEMS.find((q) => q.id === answer.itemId),
              meaning = MEANING_ITEMS.find((q) => q.id === answer.itemId);
            const label = sound
              ? `Bunyi awal: ${sound.word}`
              : (meaning?.prompt ??
                READING_ITEMS.find((q) => q.id === answer.itemId)?.text ??
                DICTATION_ITEMS.find((q) => q.id === answer.itemId)?.word ??
                "Urutan angka");
            let response: string;
            if (answer.type === "dictation")
              response = answer.text?.trim() || "Belum dijawab";
            else if (answer.type === "oral")
              response =
                answer.verdict === "correct"
                  ? "Sesuai"
                  : answer.verdict === "incorrect"
                    ? "Ada kekeliruan"
                    : "Belum dinilai";
            else if (answer.type === "naming")
              response = answer.reviewed
                ? `${answer.errors.length} angka keliru atau terlewat`
                : "Belum diperiksa";
            else
              response =
                answer.option === null
                  ? "Belum dijawab"
                  : (sound?.options[answer.option]?.label ??
                    meaning?.options[answer.option] ??
                    "Belum dinilai");
            return (
              <li key={answer.itemId}>
                <strong>{label}</strong>
                <span>
                  {response}
                  {answer.assisted ? " · Dibantu" : ""}
                  {answer.durationMs !== null
                    ? ` · ${(answer.durationMs / 1000).toFixed(1).replace(".", ",")} detik`
                    : ""}
                  {answer.interruptions
                    ? ` · ${answer.interruptions} interupsi`
                    : ""}
                  {"audioPlays" in answer && answer.audioPlays > 1
                    ? ` · Suara ${answer.audioPlays} kali`
                    : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </details>
      <p className="assessment-disclaimer">
        Catatan ini bukan diagnosis atau tingkat risiko disleksia. Tes belum
        memiliki norma usia.
      </p>
    </section>
  );
}
