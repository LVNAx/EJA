"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WritingCanvas } from "@/features/learning/literacy/writing/writing-canvas";
import { writingCharacters } from "@/features/learning/literacy/writing/tracing";
import {
  ensurePracticeSession,
  finishPractice,
  useAppState,
} from "@/features/learning/state/store";
import { learningHref } from "@/features/learning/paths";

export default function WritingPage() {
  const { childId } = useParams<{ childId: string }>();
  const router = useRouter();
  const state = useAppState();
  const [character, setCharacter] = useState("A");
  const [category, setCategory] = useState<"upper" | "lower" | "digits">(
    "upper",
  );
  const groups = {
    upper: writingCharacters.filter((item) => /^[A-Z]$/.test(item)),
    lower: writingCharacters.filter((item) => /^[a-z]$/.test(item)),
    digits: writingCharacters.filter((item) => /^[0-9]$/.test(item)),
  };
  const activeId = state.activePractices.writing;
  const active = activeId ? state.sessions[activeId] : null;
  const sessionId = active?.activityId === character ? active.id : null;

  useEffect(() => {
    ensurePracticeSession(
      "writing",
      character,
      `Latihan Menulis: ${character}`,
    );
  }, [character]);

  const finish = (score: number) => {
    if (!sessionId) return;
    const completed = finishPractice(sessionId, [
      `Menelusuri ${/^[0-9]$/.test(character) ? "angka" : "huruf"} ${character}`,
      `Kecocokan jalur ${score}%`,
    ]);
    if (completed) router.push(learningHref(childId, `/ringkasan/${completed}`));
  };

  return (
    <div className="container literacy-page">
      <div className="breadcrumbs">
        <Link href={learningHref(childId)}>Beranda</Link>
        <span>/</span>
        <Link href={learningHref(childId, "/literasi")}>Membaca & Menulis</Link>
        <span>/</span>
        <span>Latihan Menulis</span>
      </div>
      <div className="literacy-heading">
        <span className="section-kicker">MODUL MEMBACA & MENULIS</span>
        <h1>Latihan Menulis</h1>
        <p>
          Pilih huruf A–Z, a–z, atau angka 0–9. Ikuti garis contoh dengan jari,
          mouse, atau stylus.
        </p>
      </div>
      <div className="writing-layout">
        <aside className="writing-picker">
          <h2>Pilih bentuk</h2>
          <p className="list-hint">Coba satu per satu, ya!</p>
          <div className="character-categories" aria-label="Jenis bentuk">
            {(["upper", "lower", "digits"] as const).map((group) => (
              <button
                key={group}
                className={category === group ? "selected" : ""}
                aria-pressed={category === group}
                onClick={() => {
                  setCategory(group);
                  setCharacter(groups[group][0]);
                }}
              >
                {group === "upper" ? "A–Z" : group === "lower" ? "a–z" : "0–9"}
              </button>
            ))}
          </div>
          <p className="category-label">
            {category === "upper"
              ? "Huruf besar"
              : category === "lower"
                ? "Huruf kecil"
                : "Angka"}
          </p>
          <div className="character-grid">
            {groups[category].map((item) => (
              <button
                key={item}
                onClick={() => setCharacter(item)}
                aria-pressed={character === item}
                className={character === item ? "selected" : ""}
              >
                {item}
              </button>
            ))}
          </div>
        </aside>
        <WritingCanvas
          key={character}
          character={character}
          onFinish={finish}
          ready={!!sessionId}
        />
      </div>
    </div>
  );
}
