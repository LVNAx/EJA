"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import {
  speakIndonesian,
  speechMessage,
  stopSpeaking,
} from "@/lib/speech/indonesian";

interface Props {
  text: string;
  autoPlay?: boolean;
  label?: string;
  onHeard?: () => void;
  onUnavailable?: () => void;
}

export function SpeakButton({
  text,
  autoPlay = true,
  label = "Dengarkan kata",
  onHeard,
  onUnavailable,
}: Props) {
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState(false);
  const run = useRef(0);
  const callbacks = useRef({ onHeard, onUnavailable });
  callbacks.current = { onHeard, onUnavailable };

  const play = async () => {
    const current = ++run.current;
    setPlaying(true);
    setMessage("");
    const result = await speakIndonesian(text, { rate: 0.8 });
    if (run.current !== current) return;
    setPlaying(false);
    if (result === "spoken") callbacks.current.onHeard?.();
    else if (result !== "cancelled") {
      setMessage(
        result === "missing-voice"
          ? speechMessage
          : "Suara belum terdengar. Tekan tombol suara untuk mencoba lagi.",
      );
      callbacks.current.onUnavailable?.();
    }
  };

  useEffect(() => {
    setMessage("");
    if (autoPlay) void play();
    return () => {
      run.current += 1;
      stopSpeaking();
    };
    // The current callbacks are read from a ref; a new question starts a new run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, autoPlay]);

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => void play()}
        disabled={playing}
        className={`btn-primary relative h-24 w-24 !p-0 ${playing ? "animate-pulse" : ""}`}
        aria-label={playing ? "Sedang membacakan" : label}
      >
        <Volume2 size={40} strokeWidth={2.4} aria-hidden="true" />
      </button>
      <span className="text-sm font-medium text-neutral-600">
        {playing ? "Dengarkan dulu, ya." : "Tekan untuk mendengar kata lagi."}
      </span>
      {message && (
        <p
          role="status"
          className="rounded-xl bg-orange-50 p-3 text-center text-sm text-neutral-700"
        >
          {message} Minta bantuan orang dewasa jika suara tetap tidak terdengar.
        </p>
      )}
    </div>
  );
}
