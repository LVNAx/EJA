"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { WritingCanvas } from "@/features/learning/literacy/writing/writing-canvas";
import { writingCharacters } from "@/features/learning/literacy/writing/tracing";
import {
  ensurePracticeSession,
  finishPractice,
  recordHelp,
  recordWritingAttempt,
  selectPractice,
  useAppState,
  useBrowserReady,
} from "@/features/learning/state/store";
import { learningHref } from "@/features/learning/paths";

const groups = {
  upper: writingCharacters.filter((item) => /^[A-Z]$/.test(item)),
  lower: writingCharacters.filter((item) => /^[a-z]$/.test(item)),
  digits: writingCharacters.filter((item) => /^[0-9]$/.test(item)),
};

export default function WritingPage() {
  const { childId } = useParams<{ childId: string }>();
  const router = useRouter();
  const state = useAppState();
  const ready = useBrowserReady();
  const character = writingCharacters.includes(state.selections.writing)
    ? state.selections.writing
    : "A";
  const category = /^[A-Z]$/.test(character)
    ? "upper"
    : /^[a-z]$/.test(character)
      ? "lower"
      : "digits";
  const activeId = state.activePractices.writing;
  const active = activeId ? state.sessions[activeId] : null;
  const sessionId = active?.activityId === character ? active.id : null;
  useEffect(() => {
    if (ready)
      ensurePracticeSession("writing", character, `Menulis: ${character}`);
  }, [ready, character]);

  const recordAttempt = (score: number) => {
    if (sessionId) recordWritingAttempt(sessionId, score);
  };
  const finish = (score: number) => {
    if (!sessionId) return;
    recordAttempt(score);
    const completed = finishPractice(sessionId, [
      `Berlatih menulis ${/^[0-9]$/.test(character) ? "angka" : "huruf"} ${character}`,
      `Kecocokan bentuk dengan contoh: ${score}%`,
    ]);
    if (completed)
      router.push(learningHref(childId, `/ringkasan/${completed}`));
  };

  return (
    <div className="container literacy-page">
      <div className="breadcrumbs">
        <Link href={learningHref(childId)}>Beranda</Link>
        <span>/</span>
        <Link href={learningHref(childId, "/literasi")}>Membaca & Menulis</Link>
        <span>/</span>
        <span>Menulis</span>
      </div>
      <div className="literacy-heading">
        <span className="section-kicker">MEMBACA & MENULIS</span>
        <h1>Ayo menulis</h1>
        <p>Pilih huruf atau angka. Ikuti garis mulai dari nomor satu.</p>
      </div>
      <div className="writing-layout">
        <aside className="writing-picker">
          <h2>Pilih huruf atau angka</h2>
          <div className="character-categories" aria-label="Jenis tulisan">
            {(["upper", "lower", "digits"] as const).map((group) => (
              <button
                key={group}
                disabled={!ready}
                className={category === group ? "selected" : ""}
                aria-pressed={category === group}
                onClick={() => selectPractice("writing", groups[group][0])}
              >
                {group === "upper" ? "A–Z" : group === "lower" ? "a–z" : "0–9"}
              </button>
            ))}
          </div>
          <label className="character-select">
            {category === "upper"
              ? "Huruf besar"
              : category === "lower"
                ? "Huruf kecil"
                : "Angka"}
            <select
              aria-label={
                category === "upper"
                  ? "Huruf besar"
                  : category === "lower"
                    ? "Huruf kecil"
                    : "Angka"
              }
              disabled={!ready}
              value={character}
              onChange={(event) =>
                selectPractice("writing", event.target.value)
              }
            >
              {groups[category].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <details className="all-characters">
            <summary>
              Lihat semua {category === "digits" ? "angka" : "huruf"}
            </summary>
            <div className="character-grid">
              {groups[category].map((item) => (
                <button
                  key={item}
                  disabled={!ready}
                  onClick={() => selectPractice("writing", item)}
                  aria-pressed={character === item}
                  className={character === item ? "selected" : ""}
                >
                  {item}
                </button>
              ))}
            </div>
          </details>
        </aside>
        <WritingCanvas
          key={character}
          character={character}
          onFinish={finish}
          ready={!!sessionId}
          onRetryAttempt={recordAttempt}
          onGuide={() => sessionId && recordHelp(sessionId, "hint")}
        />
      </div>
    </div>
  );
}
