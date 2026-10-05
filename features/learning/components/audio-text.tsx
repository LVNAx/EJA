"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

export function AudioText({ text, rate }: { text: string; rate: number }) {
  const [unavailable, setUnavailable] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [charIndex, setCharIndex] = useState<number | null>(null);
  const [hasBoundary, setHasBoundary] = useState(false);
  const voices = useRef<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const refresh = () => {
      voices.current = window.speechSynthesis.getVoices();
    };
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener("voiceschanged", refresh);
    };
  }, [text]);
  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
    setPlaying(false);
    setCharIndex(null);
    setHasBoundary(false);
  }, []);
  const speak = () => {
    if (!("speechSynthesis" in window)) {
      setUnavailable(true);
      return;
    }
    stop();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = rate;
    const voice =
      window.speechSynthesis
        .getVoices()
        .find((item) => item.lang.toLowerCase().startsWith("id")) ??
      voices.current.find((item) => item.lang.toLowerCase().startsWith("id"));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => {
      setPlaying(false);
      setCharIndex(null);
      setHasBoundary(false);
    };
    utterance.onerror = () => {
      setPlaying(false);
      setCharIndex(null);
      setHasBoundary(false);
    };
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        setHasBoundary(true);
        setCharIndex(event.charIndex);
      }
    };
    window.speechSynthesis.speak(utterance);
  };
  const words = [...text.matchAll(/\S+/g)];
  return (
    <>
      <p
        className={`lesson-text ${playing && !hasBoundary ? "speaking-chunk" : ""}`}
      >
        {words.map((match, index) => {
          const start = match.index ?? 0;
          const end = start + match[0].length;
          return (
            <span
              key={`${start}-${index}`}
              className={
                playing &&
                hasBoundary &&
                charIndex !== null &&
                charIndex >= start &&
                charIndex < end
                  ? "speaking-word"
                  : ""
              }
            >
              {match[0]}
              {index < words.length - 1 ? " " : ""}
            </span>
          );
        })}
      </p>
      <div className="audio-row">
        <button className="audio-button" onClick={speak}>
          <Icon name="sound" size={20} /> Dengarkan
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
          Audio tidak tersedia di browser ini. Kamu tetap bisa membaca
          materinya.
        </p>
      )}
    </>
  );
}
