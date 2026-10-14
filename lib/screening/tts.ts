// Shared Indonesian voice selection also applies to screening and the child home.
export {
  isSpeechAvailable as isTtsAvailable,
  stopSpeaking,
} from "@/lib/speech/indonesian";
import { speakIndonesian } from "@/lib/speech/indonesian";
export const speak = (text: string, rate = 0.8) =>
  speakIndonesian(text, { rate });
