export function findIndonesianVoice(
  voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  return (
    voices.find((voice) => voice.lang.toLowerCase() === "id-id") ??
    voices.find((voice) => /^id(?:[-_]|$)/i.test(voice.lang)) ??
    null
  );
}
