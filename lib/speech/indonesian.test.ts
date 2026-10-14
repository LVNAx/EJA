import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { speakIndonesian, stopSpeaking } from "./indonesian";

class Utterance {
  text: string;
  lang = "";
  voice: SpeechSynthesisVoice | null = null;
  rate = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}
const voice = (lang: string) => ({ lang }) as SpeechSynthesisVoice;
let voices: SpeechSynthesisVoice[];
let events: EventTarget;
const speak = vi.fn((utterance: Utterance) => {
  utterance.onstart?.();
  utterance.onend?.();
});

beforeEach(() => {
  vi.useFakeTimers();
  voices = [voice("en-US")];
  events = new EventTarget();
  speak.mockClear();
  vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
  vi.stubGlobal("window", {
    speechSynthesis: {
      getVoices: () => voices,
      speak,
      cancel: vi.fn(),
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
    },
  });
});
afterEach(() => {
  stopSpeaking();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("suara Indonesia bersama", () => {
  it("menunggu daftar suara lalu memilih Indonesia, bukan suara Inggris bawaan", async () => {
    const pending = speakIndonesian("kucing");
    voices.push(voice("id-ID"));
    events.dispatchEvent(new Event("voiceschanged"));
    expect(await pending).toBe("spoken");
    const utterance = speak.mock.calls[0][0];
    expect(utterance.lang).toBe("id-ID");
    expect(utterance.voice?.lang).toBe("id-ID");
    expect(utterance.text).toBe("kucing");
  });
  it("tidak membacakan dengan bahasa lain ketika suara Indonesia tidak tersedia", async () => {
    const pending = speakIndonesian("sekolah");
    await vi.advanceTimersByTimeAsync(1800);
    expect(await pending).toBe("missing-voice");
    expect(speak).not.toHaveBeenCalled();
  });
  it("membatalkan permintaan lama saat suara baru diminta", async () => {
    const first = speakIndonesian("kata sebelumnya");
    voices = [voice("id-ID")];
    const second = speakIndonesian("kata berikutnya");
    expect(await first).toBe("cancelled");
    expect(await second).toBe("spoken");
    expect(speak.mock.calls.map(([utterance]) => utterance.text)).toEqual([
      "kata berikutnya",
    ]);
  });
  it("tombol berhenti membatalkan penantian suara tanpa mulai terlambat", async () => {
    const pending = speakIndonesian("pecahan");
    stopSpeaking();
    voices = [voice("id-ID")];
    events.dispatchEvent(new Event("voiceschanged"));
    expect(await pending).toBe("cancelled");
    expect(speak).not.toHaveBeenCalled();
  });
});

describe("berkas audio tetap", () => {
  it("tetap memutar kata tes ketika perangkat tidak mempunyai suara Indonesia", async () => {
    const requested: string[] = [];
    class RecordedAudio {
      onplaying: (() => void) | null = null;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      playbackRate = 1;
      constructor(src: string) {
        requested.push(src);
      }
      play() {
        queueMicrotask(() => {
          this.onplaying?.();
          this.onended?.();
        });
        return Promise.resolve();
      }
      pause() {}
      load() {}
      removeAttribute() {}
    }
    vi.stubGlobal("Audio", RecordedAudio);
    expect(await speakIndonesian("kucing")).toBe("spoken");
    expect(requested).toEqual(["/audio/id/kucing.wav"]);
    expect(speak).not.toHaveBeenCalled();
  });
});
