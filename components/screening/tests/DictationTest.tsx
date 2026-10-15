"use client";
import { useRef, useState } from "react";
import type { AssessmentAnswer } from "@/lib/screening/assessment";
import { DICTATION_ITEMS } from "@/lib/screening/protocol";
import { SpeakButton } from "../SpeakButton";
import { Interrupted, TestCard } from "./TestCard";
import { useTestClock } from "./useTestClock";

export function DictationTest({
  onComplete,
}: {
  onComplete: (answers: AssessmentAnswer[]) => void;
}) {
  const [index, setIndex] = useState(0),
    [text, setText] = useState("");
  const [heard, setHeard] = useState(false),
    [plays, setPlays] = useState(0),
    [assisted, setAssisted] = useState(false);
  const answers = useRef<AssessmentAnswer[]>([]),
    locked = useRef(false);
  const clock = useTestClock();
  const q = DICTATION_ITEMS[index];
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (locked.current || !heard || !text.trim() || clock.interrupted) return;
    const durationMs = clock.finish();
    if (durationMs === null) return;
    locked.current = true;
    answers.current.push({
      type: "dictation",
      itemId: q.id,
      text,
      durationMs,
      audioPlays: plays,
      assisted,
      interruptions: clock.interruptions.current,
    });
    if (index + 1 === DICTATION_ITEMS.length) onComplete(answers.current);
    else {
      setIndex(index + 1);
      setText("");
      setHeard(false);
      setPlays(0);
      setAssisted(false);
      clock.reset();
      locked.current = false;
    }
  };
  return (
    <TestCard
      title="Dikte"
      instruction="Dengar kata, lalu ketik ejaannya."
      index={index}
      total={DICTATION_ITEMS.length}
    >
      <SpeakButton
        key={q.id}
        text={q.word}
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
      {clock.interrupted && (
        <Interrupted
          onRetry={() => {
            setHeard(false);
            setText("");
            clock.start();
            clock.finish();
          }}
        />
      )}
      <form onSubmit={submit} className="assessment-form">
        <label htmlFor="dictation-answer">Tulisanmu</label>
        <input
          id="dictation-answer"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={80}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          disabled={!heard || clock.interrupted}
          placeholder="Ketik di sini"
        />
        <label className="assessment-check">
          <input
            type="checkbox"
            checked={assisted}
            onChange={(e) => setAssisted(e.target.checked)}
          />
          Dibantu pendamping
        </label>
        <button
          className="assessment-primary"
          disabled={!heard || !text.trim() || clock.interrupted}
        >
          Lanjut
        </button>
      </form>
      <button
        className="assessment-skip"
        onClick={() => onComplete(answers.current)}
      >
        Lewati bagian ini
      </button>
    </TestCard>
  );
}
