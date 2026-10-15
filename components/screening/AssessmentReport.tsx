import {
  buildAssessment,
  type AssessmentRecord,
} from "@/lib/screening/assessment";
import {
  DICTATION_ITEMS,
  MEANING_ITEMS,
  READING_ITEMS,
  SOUND_ITEMS,
} from "@/lib/screening/protocol";

export function AssessmentReport({ record }: { record: AssessmentRecord }) {
  const tasks = buildAssessment(record.submission);
  const eyes = record.submission.eyeTracking;
  return (
    <section className="assessment-report">
      <div className="assessment-card-heading">
        <p className="assessment-kicker">Catatan pendamping · Tes versi 2</p>
        <h1>Hasil kegiatan</h1>
        <p>Catatan sesi ini membantu menentukan latihan berikutnya.</p>
      </div>
      <div className="assessment-result-grid">
        {tasks.map((task) => (
          <article className="assessment-result-card" key={task.key}>
            <h2>{task.title}</h2>
            <p className="assessment-result-number">
              {task.assessed ? `${task.correct} / ${task.assessed}` : "—"}
            </p>
            <p>{task.assessed ? "jawaban sesuai" : "Belum dinilai"}</p>
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
        Bacaan dan penyebutan angka dinilai pendamping. Waktu tidak menentukan
        benar atau salah.
      </p>
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
      {eyes && eyes.observedMs > 0 && (
        <details className="assessment-evidence">
          <summary>Catatan kamera saat membaca</summary>
          <p>
            Mata terbaca selama{" "}
            {Math.round((100 * eyes.trackedMs) / eyes.observedMs)}% dari{" "}
            {(eyes.observedMs / 1000).toFixed(1)} detik pengamatan. Angka ini
            hanya menunjukkan ketersediaan pelacakan.
          </p>
        </details>
      )}
      <p className="assessment-disclaimer">
        Catatan ini bukan diagnosis atau tingkat risiko disleksia. Tes belum
        memiliki norma usia.
      </p>
    </section>
  );
}
