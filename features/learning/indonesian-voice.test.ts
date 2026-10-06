import { describe, expect, it } from "vitest";
import { findIndonesianVoice } from "./indonesian-voice";

const voice = (lang: string) => ({ lang }) as SpeechSynthesisVoice;

describe("findIndonesianVoice", () => {
  it("memilih suara Indonesia walaupun suara Inggris ada lebih dulu", () => {
    const indonesian = voice("id-ID");
    expect(findIndonesianVoice([voice("en-US"), indonesian])).toBe(indonesian);
  });

  it("mendukung kode bahasa id dan tidak memakai bahasa lain", () => {
    expect(findIndonesianVoice([voice("id")])?.lang).toBe("id");
    expect(findIndonesianVoice([voice("en-US"), voice("hi-IN")])).toBeNull();
  });
});
