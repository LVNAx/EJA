"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/features/learning/components/icons";
import {
  speakIndonesian,
  speechMessage,
  stopSpeaking,
} from "@/lib/speech/indonesian";
import { spokenSyllables, type ReadingItem } from "./data";

export function SyllableAudio({
  item,
  rate,
  onListen,
}: {
  item: ReadingItem;
  rate: number;
  onListen?: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [unavailable, setUnavailable] = useState<"browser" | "voice" | null>(
    null,
  );
  const run = useRef(0);
  const sequence = spokenSyllables(item.words);
  const stop = useCallback(() => {
    run.current += 1;
    stopSpeaking();
    setPlaying(false);
    setActiveIndex(null);
  }, []);
  useEffect(
    () => () => {
      run.current += 1;
      stopSpeaking();
    },
    [item.id],
  );

  const speak = async () => {
    stop();
    const current = run.current;
    setPlaying(true);
    setUnavailable(null);
    for (let index = 0; index < sequence.length; index++) {
      if (run.current !== current) return;
      const part = sequence[index];
      const result = await speakIndonesian(part.text, {
        rate,
        onStart: () => {
          if (run.current !== current) return;
          setActiveIndex(index);
          if (index === 0) onListen?.();
        },
      });
      if (run.current !== current) return;
      if (result !== "spoken") {
        setPlaying(false);
        setActiveIndex(null);
        if (result !== "cancelled")
          setUnavailable(result === "missing-voice" ? "voice" : "browser");
        return;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, part.lastInWord ? 350 : 240),
      );
    }
    if (run.current === current) {
      setPlaying(false);
      setActiveIndex(null);
    }
  };

  let syllableIndex = 0;
  return (
    <>
      <p className="lesson-text">{item.text}</p>
      <div
        className="syllable-display"
        aria-label={`Suku kata untuk ${item.text}`}
      >
        <span className="syllable-caption">IKUTI SUKU KATANYA</span>
        <div className="spoken-words">
          {item.words.map((word, wordIndex) => (
            <span className="spoken-word" key={`${word.text}-${wordIndex}`}>
              {word.syllables.map((part, index) => {
                const current = syllableIndex++;
                return (
                  <span className="syllable-piece" key={`${part}-${index}`}>
                    <span
                      className={`syllable-chip ${activeIndex === current ? "active" : ""}`}
                    >
                      {part}
                    </span>
                    {index < word.syllables.length - 1 && (
                      <span className="syllable-dash" aria-hidden="true">
                        –
                      </span>
                    )}
                  </span>
                );
              })}
            </span>
          ))}
        </div>
      </div>
      <div className="audio-row">
        <button
          className="audio-button"
          onClick={() => void speak()}
          disabled={playing}
        >
          <Icon name="sound" size={20} /> Dengarkan per suku kata
        </button>
        <button
          className="audio-button audio-stop"
          onClick={stop}
          disabled={!playing}
        >
          <Icon name="stop" size={17} /> Hentikan
        </button>
      </div>
      {unavailable === "browser" && (
        <p className="assistive-note">
          Audio tidak tersedia di browser ini. Suku katanya tetap bisa dibaca
          satu per satu.
        </p>
      )}
      {unavailable === "voice" && (
        <p className="assistive-note">{speechMessage}</p>
      )}
    </>
  );
}
