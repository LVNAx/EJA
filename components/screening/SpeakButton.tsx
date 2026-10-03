"use client";

import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { isTtsAvailable, speak } from "@/lib/screening/tts";

interface Props {
  text: string;
  autoPlay?: boolean;
  /** Teks besar ditampilkan hanya bila TTS tidak tersedia. */
  fallbackLabel?: string;
}

export function SpeakButton({ text, autoPlay = true, fallbackLabel }: Props) {
  const [available, setAvailable] = useState(true);
  const [playing, setPlaying] = useState(false);

  const play = async () => {
    setPlaying(true);
    await speak(text);
    setPlaying(false);
  };

  useEffect(() => {
    const ok = isTtsAvailable();
    setAvailable(ok);
    if (ok && autoPlay) void play();
    return () => {
      if (ok) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="flex flex-col items-center gap-3">
      <button type="button" onClick={play} className={`btn-primary relative h-24 w-24 !p-0 ${playing ? "animate-pulse" : ""}`} aria-label="Putar suara">
        <Volume2 size={40} strokeWidth={2.4} />
      </button>
      <span className="text-sm font-medium text-neutral-500">Ketuk untuk mendengar lagi</span>
      {!available && <p className="text-5xl font-bold tracking-wide">{fallbackLabel ?? text.toUpperCase()}</p>}
    </div>
  );
}
