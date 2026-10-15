"use client";
import { useState } from "react";
import type { AssessmentAnswer } from "@/lib/screening/assessment";
import { NAMING_GRID } from "@/lib/screening/protocol";
import { Interrupted, TestCard } from "./TestCard";
import { useTestClock } from "./useTestClock";

export function NamingTest({
  onComplete,
}: {
  onComplete: (answers: AssessmentAnswer[]) => void;
}) {
  const [phase, setPhase] = useState<
    "familiar" | "ready" | "running" | "review"
  >("familiar");
  const [errors, setErrors] = useState<number[]>([]),
    [reviewed, setReviewed] = useState(false),
    [assisted, setAssisted] = useState(false),
    [durationMs, setDuration] = useState<number | null>(null);
  const clock = useTestClock();
  const start = () => {
    setErrors([]);
    setReviewed(false);
    setPhase("running");
    clock.start();
  };
  return (
    <TestCard
      title="Sebut angka"
      instruction={
        phase === "review"
          ? "Pendamping: tandai angka yang keliru atau terlewat."
          : "Sebut dari kiri ke kanan, baris demi baris."
      }
      index={0}
      total={1}
    >
      {phase === "familiar" ? (
        <>
          <div className="assessment-familiar" aria-label="Angka latihan">
            2 · 4 · 6 · 8
          </div>
          <p className="assessment-helper">
            Coba sebut empat angka ini dahulu.
          </p>
          <button
            className="assessment-primary"
            onClick={() => setPhase("ready")}
          >
            Sudah mengenal semuanya
          </button>
          <button
            className="assessment-secondary"
            onClick={() => onComplete([])}
          >
            Belum mengenal semuanya
          </button>
        </>
      ) : (
        <>
          {phase === "ready" ? (
            <button className="assessment-primary" onClick={start}>
              Mulai menyebut
            </button>
          ) : (
            <>
              <div className="assessment-number-grid" aria-label="Urutan angka">
                {NAMING_GRID.map((number, i) =>
                  phase === "review" ? (
                    <button
                      key={i}
                      aria-label={`Posisi ${i + 1}, angka ${number}`}
                      aria-pressed={errors.includes(i)}
                      className={errors.includes(i) ? "marked" : ""}
                      onClick={() =>
                        setErrors((es) =>
                          es.includes(i)
                            ? es.filter((n) => n !== i)
                            : [...es, i],
                        )
                      }
                    >
                      {number}
                    </button>
                  ) : (
                    <span key={i}>{number}</span>
                  ),
                )}
              </div>
              {phase === "running" && (
                <>
                  <p className="assessment-timer" aria-label="Waktu menyebut">
                    {clock.seconds} detik
                  </p>
                  {clock.interrupted ? (
                    <Interrupted onRetry={start} />
                  ) : (
                    <button
                      className="assessment-primary"
                      onClick={() => {
                        setDuration(clock.finish());
                        setPhase("review");
                      }}
                    >
                      Selesai menyebut
                    </button>
                  )}
                </>
              )}
              {phase === "review" && (
                <>
                  <p className="assessment-helper">
                    {errors.length} angka ditandai keliru.
                  </p>
                  <label className="assessment-check">
                    <input
                      type="checkbox"
                      checked={reviewed}
                      onChange={(e) => setReviewed(e.target.checked)}
                    />
                    Sudah diperiksa pendamping
                  </label>
                  <label className="assessment-check">
                    <input
                      type="checkbox"
                      checked={assisted}
                      onChange={(e) => setAssisted(e.target.checked)}
                    />
                    Dibantu saat menyebut
                  </label>
                  <button
                    className="assessment-primary"
                    disabled={!reviewed || durationMs === null}
                    onClick={() =>
                      onComplete([
                        {
                          type: "naming",
                          itemId: "naming-grid",
                          durationMs,
                          errors,
                          reviewed,
                          familiar: true,
                          assisted,
                          interruptions: clock.interruptions.current,
                        },
                      ])
                    }
                  >
                    Simpan dan lanjut
                  </button>
                  <button className="assessment-secondary" onClick={start}>
                    Ulangi giliran ini
                  </button>
                </>
              )}
            </>
          )}
        </>
      )}
      <button className="assessment-skip" onClick={() => onComplete([])}>
        Lewati bagian ini
      </button>
    </TestCard>
  );
}
