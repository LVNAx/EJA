"use client";
import { useRef, useState } from "react";
import type { AssessmentAnswer } from "@/lib/screening/assessment";
import { SOUND_ITEMS } from "@/lib/screening/protocol";
import { Illustration } from "../Illustration";
import { SpeakButton } from "../SpeakButton";
import { Interrupted, TestCard } from "./TestCard";
import { useTestClock } from "./useTestClock";

export function SoundTest({
  onComplete,
}: {
  onComplete: (answers: AssessmentAnswer[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [heard, setHeard] = useState(false);
  const [assisted, setAssisted] = useState(false);
  const [plays, setPlays] = useState(0);
  const answers = useRef<AssessmentAnswer[]>([]);
  const locked = useRef(false);
  const clock = useTestClock();
  const q = SOUND_ITEMS[index];
  const retry = () => {
    setHeard(false);
    clock.start();
    clock.finish();
  };
  const choose = (option: number) => {
    if (locked.current || !heard || clock.interrupted) return;
    const durationMs = clock.finish();
    if (durationMs === null) return;
    locked.current = true;
    answers.current.push({
      type: "choice",
      itemId: q.id,
      option,
      durationMs,
      audioPlays: plays,
      assisted,
      interruptions: clock.interruptions.current,
    });
    if (index + 1 === SOUND_ITEMS.length) onComplete(answers.current);
    else {
      setIndex(index + 1);
      setHeard(false);
      setPlays(0);
      setAssisted(false);
      clock.reset();
      locked.current = false;
    }
  };
  return (
    <TestCard
      title="Bunyi kata"
      instruction="Pilih gambar dengan bunyi awal yang sama."
      index={index}
      total={SOUND_ITEMS.length}
    >
      <SpeakButton
        key={q.id}
        text={q.audio}
        compact
        autoPlay={false}
        onPlayStart={() => {
          setHeard(false);
          clock.finish();
        }}
        onHeard={() => {
          if (!document.hidden) {
            setHeard(true);
            setPlays((p) => p + 1);
            clock.start();
          }
        }}
      />
      {clock.interrupted && <Interrupted onRetry={retry} />}
      <div className="assessment-picture-options">
        {q.options.map((option, i) => (
          <button
            key={option.label}
            aria-label={option.label}
            disabled={!heard || clock.interrupted}
            onClick={() => choose(i)}
          >
            <Illustration name={option.art} size={88} />
          </button>
        ))}
      </div>
      <label className="assessment-check">
        <input
          type="checkbox"
          checked={assisted}
          onChange={(e) => setAssisted(e.target.checked)}
        />
        Dibantu pendamping
      </label>
      <button
        className="assessment-skip"
        onClick={() => onComplete(answers.current)}
      >
        Lewati bagian ini
      </button>
    </TestCard>
  );
}
