"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/features/learning/components/icons";
import {
  readingItems,
  normalizeSpeech,
} from "@/features/learning/literacy/reading/data";
import { SyllableAudio } from "@/features/learning/literacy/reading/syllable-audio";
import {
  getRecognitionConstructor,
  type Recognition,
} from "@/features/learning/literacy/reading/speech-recognition";
import {
  ensurePracticeSession,
  finishPractice,
  useAppState,
} from "@/features/learning/state/store";
import { learningHref } from "@/features/learning/paths";

const subscribeBrowser = () => () => {};

export default function ReadingPage() {
  const { childId } = useParams<{ childId: string }>();
  const router = useRouter();
  const state = useAppState();
  const [selectedId, setSelectedId] = useState(readingItems[0].id);
  const [trying, setTrying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("");
  const [audioRun, setAudioRun] = useState(0);
  const recognition = useRef<Recognition | null>(null);
  const heardSpeech = useRef(false);
  const micSupported = useSyncExternalStore(
    subscribeBrowser,
    () => !!getRecognitionConstructor(),
    () => false,
  );
  const item =
    readingItems.find((entry) => entry.id === selectedId) ?? readingItems[0];
  const activeId = state.activePractices.reading;
  const active = activeId ? state.sessions[activeId] : null;
  const sessionId = active?.activityId === item.id ? active.id : null;

  const stopRecognition = () => {
    const instance = recognition.current;
    if (!instance) return;
    instance.onresult = null;
    instance.onerror = null;
    instance.onend = null;
    try {
      instance.stop();
    } catch {
      /* Already stopped. */
    }
    recognition.current = null;
  };

  useEffect(() => {
    ensurePracticeSession("reading", item.id, `Latihan Membaca: ${item.text}`);
    return () => {
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
        recognition.current = null;
      }
    };
  }, [item.id, item.text]);

  const chooseItem = (id: string) => {
    stopRecognition();
    setSelectedId(id);
    setTrying(false);
    setRecording(false);
    setTranscript("");
    setMessage("");
  };

  const startRecording = () => {
    const Constructor = getRecognitionConstructor();
    if (!Constructor) {
      setMessage(
        "Mikrofon tidak tersedia di browser ini. Kamu tetap bisa membaca sendiri.",
      );
      return;
    }
    stopRecognition();
    setAudioRun((value) => value + 1);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    const instance = new Constructor();
    instance.lang = "id-ID";
    instance.interimResults = false;
    instance.continuous = false;
    heardSpeech.current = false;
    instance.onresult = (event) => {
      const heard = event.results[0]?.[0]?.transcript ?? "";
      heardSpeech.current = !!heard;
      setTranscript(heard);
      setMessage(
        normalizeSpeech(heard) === normalizeSpeech(item.text)
          ? `${item.kind === "kata" ? "Kata" : "Kalimat"} yang terdengar sudah cocok. Bagus sudah mencoba!`
          : "Yang terdengar belum sama. Coba lagi jika kamu mau.",
      );
    };
    instance.onerror = (event) => {
      setRecording(false);
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setMessage(
          "Izin mikrofon tidak diberikan. Kamu tetap bisa menyelesaikan latihan.",
        );
      } else if (event.error === "no-speech") {
        setMessage("Belum ada suara yang terdengar. Coba lagi jika kamu mau.");
      } else if (event.error === "language-not-supported") {
        setMessage(
          "Pengenalan suara Bahasa Indonesia belum didukung browser ini. Kamu tetap bisa membaca sendiri.",
        );
      } else {
        setMessage(
          "Mikrofon belum bisa digunakan. Lanjutkan dengan membaca sendiri.",
        );
      }
    };
    instance.onend = () => {
      setRecording(false);
      if (!heardSpeech.current)
        setMessage(
          (current) =>
            current ||
            "Belum ada suara yang terdengar. Coba lagi jika kamu mau.",
        );
    };
    recognition.current = instance;
    try {
      instance.start();
      setRecording(true);
      setMessage("");
      setTranscript("");
    } catch {
      setRecording(false);
      setMessage(
        "Mikrofon belum bisa digunakan. Lanjutkan dengan membaca sendiri.",
      );
    }
  };

  const finish = () => {
    if (!sessionId) return;
    stopRecognition();
    const completed = finishPractice(sessionId, [
      `Membaca ${item.kind}: ${item.text}`,
    ]);
    if (completed) router.push(learningHref(childId, `/ringkasan/${completed}`));
  };

  return (
    <div className="container literacy-page">
      <div className="breadcrumbs">
        <Link href={learningHref(childId)}>Beranda</Link>
        <span>/</span>
        <Link href={learningHref(childId, "/literasi")}>Membaca & Menulis</Link>
        <span>/</span>
        <span>Latihan Membaca</span>
      </div>
      <div className="literacy-heading">
        <span className="section-kicker">MODUL MEMBACA & MENULIS</span>
        <h1>Latihan Membaca</h1>
        <p>
          Pilih kata atau kalimat. Dengarkan setiap suku kata, ikuti teksnya,
          lalu coba baca dengan suaramu.
        </p>
      </div>
      <div className="reading-layout">
        <aside className="reading-list">
          <h2>Pilih bacaan</h2>
          <p className="list-hint">Mulai dari yang terasa nyaman.</p>
          <div className="reading-options">
            {readingItems.map((entry) => (
              <button
                key={entry.id}
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
            <span>01</span>
            <div>
              <strong>Dengarkan dan ikuti</strong>
              <small>Suara akan membacakan suku kata satu per satu.</small>
            </div>
          </div>
          <div className="reading-target" key={item.id}>
            <SyllableAudio
              key={`${item.id}-${audioRun}`}
              item={item}
              rate={state.settings.audioRate}
            />
          </div>
          <div className="practice-step second-step">
            <span>02</span>
            <div>
              <strong>Sekarang giliranmu</strong>
              <small>Baca sendiri. Mikrofon hanya pilihan tambahan.</small>
            </div>
          </div>
          <button
            className="button button-outline"
            onClick={() => setTrying(true)}
          >
            <Icon name="sound" size={18} /> Aku siap membaca
          </button>
          {trying && (
            <div className="reading-try">
              <p>
                Coba baca: <strong>{item.text}</strong>
              </p>
              {micSupported && (
                <div className="mic-actions">
                  <button
                    className="button button-primary"
                    onClick={startRecording}
                    disabled={recording}
                  >
                    🎙 Mulai rekam
                  </button>
                  <button
                    className="button button-outline"
                    onClick={() => recognition.current?.stop()}
                    disabled={!recording}
                  >
                    Berhenti
                  </button>
                </div>
              )}
              {recording && (
                <p className="recording-status" role="status">
                  ● Sedang mendengarkan dalam Bahasa Indonesia...
                </p>
              )}
              {transcript && (
                <p className="transcript">
                  Yang terdengar: <strong>{transcript}</strong>
                </p>
              )}
              {message && (
                <p className="reading-feedback" role="status">
                  {message}
                </p>
              )}
              {!micSupported && (
                <p className="assistive-note">
                  Mikrofon tidak tersedia di browser ini. Latihan tetap bisa
                  selesai.
                </p>
              )}
            </div>
          )}
          <div className="practice-actions">
            <button
              className="button button-outline"
              onClick={() => {
                stopRecognition();
                setTrying(false);
                setTranscript("");
                setMessage("");
              }}
            >
              Coba Lagi
            </button>
            <button
              className="button button-primary"
              onClick={finish}
              disabled={!sessionId || !trying}
            >
              Selesai <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
