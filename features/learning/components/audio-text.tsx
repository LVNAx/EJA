"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import {
  speakIndonesian,
  speechMessage,
  stopSpeaking,
} from "@/lib/speech/indonesian";

export function AudioText({
  text,
  spokenText = text,
  rate,
  onListen,
  hideText = false,
  label = "Dengarkan",
}: {
  text: string;
  spokenText?: string;
  rate: number;
  onListen?: () => void;
  hideText?: boolean;
  label?: string;
}) {
  const [unavailable, setUnavailable] = useState<"browser" | "voice" | null>(
    null,
  );
  const [playing, setPlaying] = useState(false);
  const [charIndex, setCharIndex] = useState<number | null>(null);
  const [hasBoundary, setHasBoundary] = useState(false);
  const run = useRef(0);
  useEffect(
    () => () => {
      run.current += 1;
      stopSpeaking();
    },
    [text],
  );
  const stop = useCallback(() => {
    run.current += 1;
    stopSpeaking();
    setPlaying(false);
    setCharIndex(null);
    setHasBoundary(false);
  }, []);
  const speak = async () => {
    stop();
    const current = run.current;
    setPlaying(true);
    setUnavailable(null);
    const result = await speakIndonesian(spokenText, {
      rate,
      onStart: () => {
        if (run.current === current) onListen?.();
      },
      onBoundary: (event) => {
        if (
          run.current === current &&
          spokenText === text &&
          event.name === "word"
        ) {
          setHasBoundary(true);
          setCharIndex(event.charIndex);
        }
      },
    });
    if (run.current !== current) return;
    setPlaying(false);
    setCharIndex(null);
    setHasBoundary(false);
    if (result !== "spoken" && result !== "cancelled")
      setUnavailable(result === "missing-voice" ? "voice" : "browser");
  };
  const words = [...text.matchAll(/\S+/g)];
  return (
    <>
      {!hideText && (
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
      )}
      <div className="audio-row">
        <button
          className="audio-button"
          onClick={() => void speak()}
          disabled={playing}
        >
          <Icon name="sound" size={20} /> {label}
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
        <p className="assistive-note">{speechMessage}</p>
      )}
    </>
  );
}
