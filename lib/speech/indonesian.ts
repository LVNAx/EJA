import { recordedWordAudio } from "./recordings";

/** One speech channel for lessons and tests. Never fall back to another language. */
export const INDONESIAN = "id-ID";
export type SpeechResult =
  | "spoken"
  | "cancelled"
  | "missing-voice"
  | "unsupported"
  | "error";
export const speechMessage =
  "Suara Bahasa Indonesia belum tersedia. Aktifkan suara Indonesia di pengaturan perangkat, lalu coba lagi.";

export function findIndonesianVoice(
  voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  return (
    voices.find(
      (voice) => voice.lang.toLowerCase().replace("_", "-") === "id-id",
    ) ??
    voices.find((voice) => /^id(?:[-_]|$)/i.test(voice.lang)) ??
    null
  );
}

export function isSpeechAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

let active: AbortController | null = null;

export function stopSpeaking(): void {
  active?.abort();
  active = null;
  if (isSpeechAvailable()) window.speechSynthesis.cancel();
}

/** Voices often arrive after the first render, especially on mobile. */
export function waitForIndonesianVoice(
  signal: AbortSignal,
  timeout = 1800,
): Promise<SpeechSynthesisVoice | null> {
  if (!isSpeechAvailable() || signal.aborted) return Promise.resolve(null);
  const synth = window.speechSynthesis;
  const voice = findIndonesianVoice(synth.getVoices());
  if (voice) return Promise.resolve(voice);
  return new Promise((resolve) => {
    const finish = (found: SpeechSynthesisVoice | null) => {
      clearTimeout(timer);
      synth.removeEventListener("voiceschanged", refresh);
      signal.removeEventListener("abort", cancel);
      resolve(found);
    };
    const refresh = () => {
      const found = findIndonesianVoice(synth.getVoices());
      if (found) finish(found);
    };
    const cancel = () => finish(null);
    const timer = setTimeout(() => finish(null), timeout);
    synth.addEventListener("voiceschanged", refresh);
    signal.addEventListener("abort", cancel, { once: true });
    refresh();
  });
}

type SpeechOptions = {
  rate?: number;
  onStart?: () => void;
  onBoundary?: (event: SpeechSynthesisEvent) => void;
};

function playRecording(
  src: string,
  text: string,
  options: SpeechOptions,
  signal: AbortSignal,
): Promise<SpeechResult> {
  return new Promise((resolve) => {
    const audio = new Audio(src);
    let settled = false;
    let started = false;
    const finish = (result: SpeechResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      audio.onplaying = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      resolve(result);
    };
    const cancel = () => finish("cancelled");
    const timer = setTimeout(
      () => finish("error"),
      Math.max(12_000, text.length * 1000),
    );
    audio.playbackRate =
      Math.max(0.7, Math.min(1.1, options.rate ?? 0.9)) / 0.9;
    audio.onplaying = () => {
      if (!started) {
        started = true;
        options.onStart?.();
      }
    };
    audio.onended = () => finish("spoken");
    audio.onerror = () => finish("error");
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) {
      cancel();
      return;
    }
    try {
      void audio.play().catch(() => finish("error"));
    } catch {
      finish("error");
    }
  });
}

export async function speakIndonesian(
  text: string,
  options: SpeechOptions = {},
): Promise<SpeechResult> {
  stopSpeaking();
  if (typeof window === "undefined") return "unsupported";
  const controller = new AbortController();
  active = controller;
  const { signal } = controller;
  const recording = recordedWordAudio(text);
  if (recording && typeof Audio !== "undefined") {
    const result = await playRecording(recording, text, options, signal);
    if (result === "spoken" || result === "cancelled") {
      if (active === controller) active = null;
      return result;
    }
  }
  if (!isSpeechAvailable()) {
    if (active === controller) active = null;
    return "unsupported";
  }
  const voice = await waitForIndonesianVoice(signal);
  if (signal.aborted) return "cancelled";
  if (!voice) {
    if (active === controller) active = null;
    return "missing-voice";
  }
  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = (result: SpeechResult) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      if (active === controller) active = null;
      resolve(result);
    };
    const cancel = () => finish("cancelled");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = INDONESIAN;
    utterance.voice = voice;
    utterance.rate = Math.max(0.7, Math.min(1.1, options.rate ?? 0.9));
    utterance.onstart = () => {
      if (!signal.aborted && !settled) options.onStart?.();
    };
    utterance.onboundary = (event) => {
      if (!signal.aborted && !settled) options.onBoundary?.(event);
    };
    utterance.onend = () => finish("spoken");
    utterance.onerror = () => finish(signal.aborted ? "cancelled" : "error");
    signal.addEventListener("abort", cancel, { once: true });
    timer = setTimeout(
      () => {
        window.speechSynthesis.cancel();
        finish("error");
      },
      Math.min(90_000, Math.max(12_000, text.length * 150)),
    );
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      finish("error");
    }
  });
}
