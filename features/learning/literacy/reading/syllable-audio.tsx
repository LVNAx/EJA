"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/features/learning/components/icons";
import { spokenSyllables, type ReadingItem } from "./data";

export function SyllableAudio({
  item,
  rate,
}: {
  item: ReadingItem;
  rate: number;
}) {
  const [playing, setPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const voices = useRef<SpeechSynthesisVoice[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const run = useRef(0);
  const sequence = spokenSyllables(item.words);

  const stop = useCallback(() => {
    run.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
    setPlaying(false);
    setActiveIndex(null);
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const refreshVoices = () => {
      voices.current = window.speechSynthesis.getVoices();
    };
    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => {
      run.current += 1;
      if (timer.current) clearTimeout(timer.current);
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        refreshVoices,
      );
    };
  }, []);

  const speak = () => {
    if (
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      setUnavailable(true);
      return;
    }
    stop();
    const currentRun = run.current;
    setPlaying(true);
    setUnavailable(false);

    const speakPart = (index: number) => {
      if (currentRun !== run.current) return;
      if (index >= sequence.length) {
        setPlaying(false);
        setActiveIndex(null);
        return;
      }
      const part = sequence[index];
      const utterance = new SpeechSynthesisUtterance(part.text);
      utterance.lang = "id-ID";
      utterance.rate = rate;
      const voice =
        window.speechSynthesis
          .getVoices()
          .find((candidate) => candidate.lang.toLowerCase().startsWith("id")) ??
        voices.current.find((candidate) =>
          candidate.lang.toLowerCase().startsWith("id"),
        );
      if (voice) utterance.voice = voice;
      utterance.onstart = () => {
        if (currentRun === run.current) setActiveIndex(index);
      };
      utterance.onend = () => {
        if (currentRun !== run.current) return;
        timer.current = setTimeout(
          () => speakPart(index + 1),
          part.lastInWord ? 350 : 240,
        );
      };
      utterance.onerror = () => {
        if (currentRun !== run.current) return;
        setPlaying(false);
        setActiveIndex(null);
        setUnavailable(true);
      };
      window.speechSynthesis.speak(utterance);
    };
    speakPart(0);
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
        <button className="audio-button" onClick={speak}>
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
      {unavailable && (
        <p className="assistive-note">
          Audio tidak tersedia di browser ini. Suku katanya tetap bisa dibaca
          satu per satu.
        </p>
      )}
    </>
  );
}
