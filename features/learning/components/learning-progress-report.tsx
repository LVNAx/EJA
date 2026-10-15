"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppState, useBrowserReady } from "../state/store";
import {
  buildProgressModel,
  recommendPractice,
  TREND_LABELS,
} from "../model/progress-model";
import { progressDemoData } from "../model/demo-data";
import { learningHref } from "../paths";
import { DEMO_CHILD_ID } from "@/lib/routes";

const percent = (p: number) => `${Math.round(p * 100)}%`;
const dateLabel = (at: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(at));

export function LearningProgressReport({ childId }: { childId: string }) {
  const state = useAppState(childId);
  const ready = useBrowserReady();
  const [simulation, setSimulation] = useState(false);
  const showingSimulation = childId === DEMO_CHILD_ID && simulation;
  const model = useMemo(
    () => buildProgressModel(showingSimulation ? progressDemoData() : state),
    [showingSimulation, state],
  );
  const recommendation = recommendPractice(model.skills);
  return (
    <section
      className="progress-report"
      aria-labelledby="learning-progress-title"
      data-model-source={showingSimulation ? "simulation" : "practice"}
    >
      <header className="progress-heading">
        <div>
          <p className="progress-kicker">UNTUK PENDAMPING</p>
          <h2 id="learning-progress-title">Perkembangan belajar</h2>
        </div>
        {childId === DEMO_CHILD_ID && ready && (
          <button
            className="progress-link"
            onClick={() => setSimulation(!simulation)}
            aria-pressed={showingSimulation}
          >
            {showingSimulation ? "Kembali ke data latihan" : "Lihat simulasi model"}
          </button>
        )}
      </header>
      <p>
        Perkiraan diperbarui dari latihan tersimpan pada browser ini, terpisah
        untuk setiap anak.
      </p>
      {showingSimulation && (
        <p role="status" className="progress-simulation">
          Simulasi · Data contoh untuk melihat cara kerja model. Catatan latihan
          anak tidak diubah.
        </p>
      )}
      {!ready ? (
        <p role="status">Memuat perkembangan belajar...</p>
      ) : (
        <>
          <p className="progress-caption" role="status">
            {model.assessedSessions} sesi dengan hasil yang bisa diperiksa ·{" "}
            {model.unassessedSessions} sesi tanpa hasil otomatis.
          </p>
          {!model.assessedSessions && (
            <p className="progress-empty">
              Belum ada hasil yang cukup untuk membuat perkiraan. Selesaikan
              satu latihan; membaca tanpa mikrofon tetap boleh dilakukan.
            </p>
          )}
          <div className="progress-skill-grid">
            {model.skills.map((item) => (
              <article
                key={item.skill.id}
                className="progress-skill"
                data-skill={item.skill.id}
              >
                <h3>{item.skill.label}</h3>
                <p className="progress-target">
                  Target latihan: {item.skill.target}
                </p>
                {!item.enoughData ? (
                  <p className="progress-pending">
                    {item.history.length
                      ? `Baru ${item.history.length} sesi dinilai. Perlu sedikitnya 3 sesi untuk menampilkan perkiraan.`
                      : "Belum ada sesi yang bisa dinilai."}
                  </p>
                ) : (
                  <>
                    <p className="progress-estimate">
                      <strong>{percent(item.probability!)}</strong>
                      <span>perkiraan mencapai target pada sesi serupa</span>
                    </p>
                    <p className="progress-caption">
                      Rentang ketidakpastian 90%: {percent(item.interval![0])}–
                      {percent(item.interval![1])}. Rentang lebar berarti
                      perkiraan masih belum pasti.
                    </p>
                  </>
                )}
                <p className="progress-trend">{TREND_LABELS[item.trend]}</p>
                <p className="progress-caption">
                  {item.successes} dari {item.history.length} sesi yang
                  digunakan mencapai target.
                </p>
                {item.history.length > 0 && (
                  <details>
                    <summary>Riwayat dan bantuan</summary>
                    <ol className="progress-history">
                      {item.history.slice(-6).map((observation) => (
                        <li key={observation.sessionId}>
                          <span>
                            {dateLabel(observation.at)} · {observation.title}
                          </span>
                          <strong
                            className={
                              observation.success
                                ? "progress-met"
                                : "progress-retry"
                            }
                          >
                            {observation.success
                              ? "Target tercapai"
                              : "Target belum tercapai"}
                          </strong>
                          <span>
                            Contoh suara: {observation.audioPlays} · Petunjuk:{" "}
                            {observation.hints}
                          </span>
                        </li>
                      ))}
                    </ol>
                    <p className="progress-caption">
                      Ditampilkan paling banyak 6 sesi terakhir. Model
                      menggunakan paling banyak 20 sesi terakhir per kegiatan.
                    </p>
                  </details>
                )}
                <p className="progress-caption">{item.skill.note}</p>
              </article>
            ))}
          </div>
          <div className="progress-parent-advice">
            <h3>Saran pendampingan: {recommendation.skill.label}</h3>
            <p>{recommendation.reason}</p>
            <p>{recommendation.skill.support}</p>
            <Link
              className="progress-button"
              href={learningHref(childId, recommendation.skill.path)}
            >
              Buka latihan {recommendation.skill.label}
            </Link>
          </div>
        </>
      )}
      <p className="progress-caption">
        Memakai bantuan tidak dihitung sebagai kegagalan. Perkiraan ini
        menggambarkan hasil pada latihan yang dicoba, bukan nilai kemampuan anak
        secara keseluruhan atau diagnosis.
      </p>
    </section>
  );
}
