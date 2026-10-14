"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/features/learning/components/icons";
import {
  readingItems,
  matchesReading,
} from "@/features/learning/literacy/reading/data";
import { SyllableAudio } from "@/features/learning/literacy/reading/syllable-audio";
import {
  getRecognitionConstructor,
  type Recognition,
} from "@/features/learning/literacy/reading/speech-recognition";
import {
  ensurePracticeSession,
  finishPractice,
  recordHelp,
  recordReadingAttempt,
  recordSelfReading,
  selectPractice,
  useAppState,
  useBrowserReady,
} from "@/features/learning/state/store";
import { learningHref } from "@/features/learning/paths";
import { stopSpeaking } from "@/lib/speech/indonesian";

const subscribeBrowser = () => () => {};

export default function ReadingPage() {
  const { childId } = useParams<{ childId: string }>();
  const router = useRouter();
  const state = useAppState();
  const ready = useBrowserReady();
  const item =
    readingItems.find((entry) => entry.id === state.selections.reading) ??
    readingItems[0];
  const [trying, setTrying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("");
  const [audioRun, setAudioRun] = useState(0);
  const recognition = useRef<Recognition | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const micSupported = useSyncExternalStore(
    subscribeBrowser,
    () => !!getRecognitionConstructor(),
    () => false,
  );
  const activeId = state.activePractices.reading;
  const active = activeId ? state.sessions[activeId] : null;
  const sessionId = active?.activityId === item.id ? active.id : null;

  const stopRecognition = () => {
    if (timer.current) clearTimeout(timer.current);
    const instance = recognition.current;
    if (instance) {
      instance.onresult = null;
      instance.onerror = null;
      instance.onend = null;
      try {
        instance.stop();
      } catch {
        /* Already stopped. */
      }
    }
    recognition.current = null;
  };
  useEffect(() => {
    if (ready)
      ensurePracticeSession("reading", item.id, `Membaca: ${item.text}`);
    return stopRecognition;
    // Session selection is restored before creating a practice session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, item.id, item.text]);

  const chooseItem = (id: string) => {
    stopRecognition();
    selectPractice("reading", id);
    setTrying(false);
    setRecording(false);
    setTranscript("");
    setMessage("");
  };
  const startListening = () => {
    const Constructor = getRecognitionConstructor();
    if (!Constructor || !sessionId) return;
    stopRecognition();
    stopSpeaking();
    setAudioRun((value) => value + 1);
    const instance = new Constructor();
    instance.lang = "id-ID";
    instance.interimResults = false;
    instance.continuous = true;
    let heard = "";
    let failed = false;
    instance.onresult = (event) => {
      heard = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      setTranscript(heard);
      if (matchesReading(heard, item)) instance.stop();
    };
    instance.onerror = (event) => {
      failed = true;
      setRecording(false);
      const messages: Record<string, string> = {
        "not-allowed":
          "Mikrofon belum diizinkan. Kamu tetap boleh membaca sendiri.",
        "service-not-allowed":
          "Layanan suara belum diizinkan. Kamu tetap boleh membaca sendiri.",
        "no-speech":
          "Suaramu belum terdengar. Coba lagi atau lanjutkan membaca sendiri.",
        "language-not-supported":
          "Pengenalan suara Bahasa Indonesia belum tersedia di browser ini.",
        network:
          "Sambungan layanan suara terputus. Kamu tetap boleh membaca sendiri.",
      };
      setMessage(
        messages[event.error] ??
          "Layanan suara belum bisa digunakan. Kamu tetap boleh membaca sendiri.",
      );
    };
    instance.onend = () => {
      if (timer.current) clearTimeout(timer.current);
      setRecording(false);
      recognition.current = null;
      if (failed) return;
      if (!heard) {
        setMessage("Suaramu belum terdengar. Kamu boleh mencoba lagi.");
        return;
      }
      const matched = matchesReading(heard, item);
      recordReadingAttempt(sessionId, matched);
      setMessage(
        matched
          ? "Kata yang terdengar sudah sesuai. Terima kasih sudah mencoba!"
          : "Kata yang ditangkap mikrofon belum sesuai. Dengarkan contoh lalu coba lagi, atau lanjutkan membaca sendiri.",
      );
    };
    recognition.current = instance;
    try {
      instance.start();
      setRecording(true);
      setMessage("");
      setTranscript("");
      timer.current = setTimeout(() => instance.stop(), 30_000);
    } catch {
      stopRecognition();
      setRecording(false);
      setMessage(
        "Mikrofon belum bisa digunakan. Kamu tetap boleh membaca sendiri.",
      );
    }
  };
  const finish = () => {
    if (!sessionId || !trying) return;
    stopRecognition();
    recordSelfReading(sessionId);
    const completed = finishPractice(sessionId, [
      `Berlatih membaca: ${item.text}`,
    ]);
    if (completed)
      router.push(learningHref(childId, `/ringkasan/${completed}`));
  };

  return (
    <div className="container literacy-page">
      <div className="breadcrumbs">
        <Link href={learningHref(childId)}>Beranda</Link>
        <span>/</span>
        <Link href={learningHref(childId, "/literasi")}>Membaca & Menulis</Link>
        <span>/</span>
        <span>Membaca</span>
      </div>
      <div className="literacy-heading">
        <span className="section-kicker">MEMBACA & MENULIS</span>
        <h1>Ayo membaca</h1>
        <p>Dengarkan contoh. Ikuti suku katanya, lalu baca sendiri.</p>
      </div>
      <div className="reading-layout">
        <aside className="reading-list">
          <h2>Pilih bacaan</h2>
          <p className="list-hint">
            Mulai dari kata pendek, lalu coba kalimat.
          </p>
          <div className="reading-options">
            {readingItems.map((entry) => (
              <button
                key={entry.id}
                disabled={!ready}
                className={`reading-option ${entry.id === item.id ? "selected" : ""}`}
                onClick={() => chooseItem(entry.id)}
                aria-pressed={entry.id === item.id}
              >
                <span className="reading-kind">{entry.kind}</span>
                <strong>{entry.text}</strong>
              </button>
            ))}
          </div>
        </aside>
        <section className="reading-workspace">
          <div className="practice-step">
            <span>1</span>
            <div>
              <strong>Dengarkan dan ikuti</strong>
              <small>Suara dibacakan per suku kata.</small>
            </div>
          </div>
          <div className="reading-target" key={item.id}>
            <SyllableAudio
              key={`${item.id}-${audioRun}`}
              item={item}
              rate={state.settings.audioRate}
              onListen={() => sessionId && recordHelp(sessionId, "audio")}
            />
          </div>
          <div className="practice-step second-step">
            <span>2</span>
            <div>
              <strong>Sekarang coba baca</strong>
              <small>Kamu boleh membaca tanpa mikrofon.</small>
            </div>
          </div>
          <button
            className="button button-outline"
            onClick={() => setTrying(true)}
            disabled={trying}
          >
            <Icon name="sound" size={18} /> Aku siap membaca
          </button>
          {trying && (
            <div className="reading-try">
              <p>
                Baca pelan-pelan: <strong>{item.text}</strong>
              </p>
              {micSupported && (
                <>
                  <p className="assistive-note">
                    Mikrofon hanya membantu mencocokkan kata. Layanan browser
                    dapat mengirim suara untuk diproses. Minta izin orang tua
                    sebelum mencoba.
                  </p>
                  <div className="mic-actions">
                    <button
                      className="button button-primary"
                      onClick={startListening}
                      disabled={recording}
                    >
                      Coba dengan mikrofon
                    </button>
                    <button
                      className="button button-outline"
                      onClick={() => recognition.current?.stop()}
                      disabled={!recording}
                    >
                      Berhenti mendengarkan
                    </button>
                  </div>
                </>
              )}
              {recording && (
                <p className="recording-status" role="status">
                  Sedang mendengarkan dalam Bahasa Indonesia. Baca perlahan,
                  lalu tekan Berhenti.
                </p>
              )}
              {transcript && (
                <p className="transcript">
                  Yang ditangkap mikrofon: <strong>{transcript}</strong>
                </p>
              )}
              {message && (
                <p className="reading-feedback" role="status">
                  {message}
                </p>
              )}
              {!micSupported && (
                <p className="assistive-note">
                  Mikrofon belum tersedia di browser ini. Kamu tetap bisa
                  menyimpan latihan membaca mandiri.
                </p>
              )}
            </div>
          )}
          <div className="practice-actions">
            <button
              className="button button-outline"
              onClick={() => {
                stopRecognition();
                setRecording(false);
                setTranscript("");
                setMessage("");
              }}
            >
              Coba lagi
            </button>
            <button
              className="button button-primary"
              onClick={finish}
              disabled={!sessionId || !trying || recording}
            >
              Sudah berlatih · simpan
              <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
