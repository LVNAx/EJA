import type { AssessmentRecord } from "@/lib/screening/assessment";
import { MEANING_ITEMS } from "@/lib/screening/protocol";
import { irisQuality } from "@/features/learning/gaze/iris-motion";

export function ReadingSessionReport({ record }: { record: AssessmentRecord }) {
  const session = record.submission.readingSession,
    eyes = record.submission.eyeTracking;
  if (!session) return null;
  const answers = record.submission.answers.filter(
    (a) =>
      a.type === "choice" &&
      MEANING_ITEMS.some((q) => q.id === a.itemId) &&
      a.option !== null &&
      a.durationMs !== null &&
      a.durationMs > 0,
  );
  const correct = answers.filter(
    (a) =>
      a.type === "choice" &&
      MEANING_ITEMS.find((q) => q.id === a.itemId)?.correct === a.option,
  ).length;
  const quality = eyes ? irisQuality(eyes) : null;
  const motion = eyes?.motion;
  const seconds = (ms: number) => (ms / 1000).toFixed(1).replace(".", ",");
  return (
    <section
      className="assessment-camera-result"
      aria-label="Hasil membaca berwaktu"
    >
      <h2>Baca dan jawab · sesi berwaktu</h2>
      <div className="assessment-two">
        <div>
          <span>Pemahaman teks</span>
          <strong>
            {answers.length
              ? `${Math.round((correct / answers.length) * 100)} / 100`
              : "Belum dinilai"}
          </strong>
          <small>
            {correct} sesuai · {answers.length} dari 2 pertanyaan dinilai
          </small>
        </div>
        <div>
          <span>Waktu pengerjaan aktif</span>
          <strong>{seconds(session.elapsedMs)} detik</strong>
          <small>
            Batas {(session.limitMs + session.extensionMs) / 1000} detik
            {session.extensionMs
              ? ` · tambahan ${session.extensionMs / 1000} detik`
              : ""}
          </small>
        </div>
      </div>
      <p>
        {session.status === "expired"
          ? "Waktu habis; pertanyaan tanpa jawaban tetap belum dinilai."
          : session.status === "interrupted"
            ? "Sesi terputus. Catatan yang sudah diberikan dipertahankan."
            : session.status === "skipped"
              ? "Sesi dihentikan sebelum seluruh pertanyaan selesai."
              : "Teks dan dua pertanyaan selesai dikerjakan."}
        {session.interruptions
          ? ` ${session.interruptions} interupsi tercatat.`
          : ""}
      </p>
      {quality?.usable && motion ? (
        <>
          <h3>{motion.shifts} pergeseran posisi iris teramati</h3>
          <p>{quality.reason}</p>
          <small>
            {seconds(motion.validMs)} detik sampel gerak dapat dipakai ·{" "}
            {seconds(motion.headRejectedMs)} detik dengan perubahan kepala besar
            disisihkan.
          </small>
          <details className="assessment-iris-detail">
            <summary>Waktu gerakan dan jawaban</summary>
            <table>
              <caption>Perubahan iris per 5 detik waktu tes</caption>
              <thead>
                <tr>
                  <th scope="col">Rentang</th>
                  <th scope="col">Pergeseran</th>
                  <th scope="col">Sampel gerak</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(
                  {
                    length: Math.min(120, Math.ceil(session.elapsedMs / 5000)),
                  },
                  (_, i) => {
                    const w = motion.windows.find((w) => w.second === i * 5);
                    return (
                      <tr key={i}>
                        <th scope="row">
                          {i * 5}–
                          {Math.min(
                            (i + 1) * 5,
                            Math.ceil(session.elapsedMs / 1000),
                          )}{" "}
                          dtk
                        </th>
                        <td>{w && w.validMs > 0 ? w.shifts : "—"}</td>
                        <td>
                          {w ? `${seconds(w.validMs)} dtk` : "Tidak tersedia"}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
            <ul>
              {session.responseTimes.map((r) => (
                <li key={r.itemId}>
                  {MEANING_ITEMS.find((q) => q.id === r.itemId)?.prompt} ·
                  dijawab pada {seconds(r.atMs)} detik waktu tes.
                </li>
              ))}
            </ul>
            <small>
              Waktu gerakan dan jawaban memakai jam tes yang sama. Jendela tanpa
              data belum teramati; tidak berarti iris diam.
            </small>
          </details>
        </>
      ) : (
        <p>
          {quality?.reason ?? "Kamera tidak digunakan. Jawaban tetap dinilai."}
        </p>
      )}
      <p>
        Pengalaman anak:{" "}
        <strong>
          {session.experience === "moving"
            ? "tulisan terasa bergerak atau bercampur"
            : session.experience === "steady"
              ? "tulisan terasa tetap"
              : session.experience === "unsure"
                ? "belum tahu"
                : "belum dijawab"}
        </strong>
        .
      </p>
      <small>
        Pengalaman di atas disampaikan anak. Banyaknya gerakan iris tidak
        membuktikan huruf tampak bergerak atau menentukan risiko disleksia.
        Kamera belum mengukur saccade, fiksasi per kata, atau gerakan yang
        berlebihan menurut norma usia.
      </small>
    </section>
  );
}
