"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { findIndonesianVoice } from "@/features/learning/indonesian-voice";

export function AudioText({ text, rate }: { text: string; rate: number }) {
  const [unavailable, setUnavailable] = useState<"browser" | "voice" | null>(
    null,
  );
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
    if (
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      setUnavailable("browser");
      return;
    }
    stop();
    const voice = findIndonesianVoice([
      ...window.speechSynthesis.getVoices(),
      ...voices.current,
    ]);
    if (!voice) {
      setUnavailable("voice");
      return;
    }
    setUnavailable(null);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = rate;
    utterance.voice = voice;
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
      {unavailable === "browser" && (
        <p className="assistive-note">
          Audio tidak tersedia di browser ini. Kamu tetap bisa membaca
          materinya.
        </p>
      )}
      {unavailable === "voice" && (
        <p className="assistive-note">
          Suara Bahasa Indonesia belum tersedia di perangkat ini. Aktifkan suara
          Indonesia di pengaturan perangkat, lalu coba lagi.
        </p>
      )}
    </>
  );
}
