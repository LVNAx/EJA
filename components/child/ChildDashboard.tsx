"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Flame,
  Lock,
  Pencil,
  Settings,
  Star,
  Volume2,
} from "lucide-react";
import { AuroraBackground } from "@/components/screening/AuroraBackground";
import { Illustration } from "@/components/screening/Illustration";
import { LogoMark } from "@/components/site/Logo";
import { isAvatar } from "@/lib/avatars";
import type { ChildProfile } from "@/lib/dashboard/types";
import { ROUTES } from "@/lib/routes";
import {
  speakIndonesian,
  speechMessage,
  stopSpeaking,
} from "@/lib/speech/indonesian";
import { learningHref } from "@/features/learning/paths";
import {
  updateSettings,
  useAppState,
  useStorageStatus,
} from "@/features/learning/state/store";
import { evidenceStatus } from "@/features/learning/state/evidence";
import { childSummary } from "@/lib/child/summary";
import { LearningRecommendation } from "@/features/learning/components/learning-recommendation";
import { FontSelector } from "@/components/accessibility/FontSelector";
import { useFontPreference } from "@/lib/accessibility/font-preference";

export function ChildDashboard({
  profile,
  demo,
}: {
  profile: ChildProfile;
  demo: boolean;
}) {
  const state = useAppState();
  const font = useFontPreference();
  const saved = useStorageStatus();
  const [now, setNow] = useState<Date | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [audioMessage, setAudioMessage] = useState("");
  useEffect(() => {
    setNow(new Date());
    return () => stopSpeaking();
  }, []);
  const summary = childSummary(state, now ?? new Date(0));
  const href = (path: string) => learningHref(profile.id, path);
  const activeHref =
    summary.active?.kind === "math"
      ? href(`/materi/${summary.active.activityId}`)
      : href(
          `/latihan/${summary.active?.kind === "writing" ? "menulis" : "membaca"}`,
        );
  const listen = async () => {
    const result = await speakIndonesian(
      `Halo, ${profile.name}. Mau belajar apa hari ini? Pilih membaca dan menulis, atau matematika. Kamu boleh mengulang dan meminta bantuan.`,
      { rate: state.settings.audioRate },
    );
    setAudioMessage(
      result === "missing-voice"
        ? speechMessage
        : result === "unsupported" || result === "error"
          ? "Suara belum bisa diputar. Kamu tetap bisa memilih kegiatan."
          : "",
    );
  };

  return (
    <div
      className="child-dashboard min-h-screen pb-10"
      data-text-size={state.settings.textSize}
      data-reduce-motion={state.settings.reducedMotion}
    >
      <AuroraBackground paused={state.settings.reducedMotion} />
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5">
        <Link
          href={ROUTES.childHome(profile.id)}
          aria-label="EJA, beranda anak"
          className="flex items-center gap-2 font-bold"
        >
          <LogoMark size={38} /> EJA
        </Link>
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          <FontSelector />
          <button
            aria-expanded={settingsOpen}
            aria-controls="child-settings"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="btn-ghost !px-3 !py-2"
          >
            <Settings size={20} aria-hidden="true" />
            <span>Atur tampilan</span>
          </button>
          <Link href="/unlock" className="btn-ghost !px-3 !py-2">
            <Lock size={16} aria-hidden="true" /> Orang tua
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto flex max-w-5xl flex-col gap-5 px-4">
        {demo && (
          <p className="small-note text-brand-700">
            Profil contoh · Catatan belajar berasal dari perangkat ini.
          </p>
        )}
        {!saved && (
          <p
            role="alert"
            className="rounded-2xl border-2 border-orange-700 bg-orange-50 p-4"
          >
            Catatan belum tersimpan. Jangan tutup halaman dulu; minta bantuan
            orang tua.
          </p>
        )}
        {settingsOpen && (
          <section
            id="child-settings"
            aria-label="Atur tampilan"
            className="card grid gap-4 p-5 sm:grid-cols-2"
          >
            <label className="flex flex-col gap-2 font-bold">
              Ukuran huruf
              <select
                className="rounded-xl border-2 border-brand-200 bg-white p-2"
                value={state.settings.textSize}
                onChange={(e) =>
                  updateSettings({
                    textSize: e.target.value as "normal" | "large",
                  })
                }
              >
                <option value="normal">Biasa</option>
                <option value="large">Besar</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 font-bold">
              Jenis huruf
              <select
                className="rounded-xl border-2 border-brand-200 bg-white p-2"
                value={font}
                onChange={(e) =>
                  updateSettings({
                    fontFamily: e.target.value as "standard" | "opendyslexic",
                  })
                }
              >
                <option value="standard">Biasa</option>
                <option value="opendyslexic">OpenDyslexic</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 font-bold">
              Kecepatan suara
              <select
                className="rounded-xl border-2 border-brand-200 bg-white p-2"
                value={state.settings.audioRate}
                onChange={(e) =>
                  updateSettings({ audioRate: Number(e.target.value) })
                }
              >
                <option value={0.7}>Pelan</option>
                <option value={0.9}>Sedang</option>
                <option value={1.1}>Cepat</option>
              </select>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={state.settings.reducedMotion}
                onChange={(e) =>
                  updateSettings({ reducedMotion: e.target.checked })
                }
              />{" "}
              Kurangi gerakan
            </label>
          </section>
        )}
        <section className="card flex flex-wrap items-center justify-between gap-4 p-5 sm:p-7">
          <div className="flex items-center gap-4">
            <span className="rounded-2xl bg-white p-2">
              <Illustration
                name={isAvatar(profile.avatar) ? profile.avatar : "kucing"}
                size={60}
              />
            </span>
            <div>
              <h1>Halo, {profile.name}!</h1>
              <p className="mt-2 text-neutral-700">
                Kita belajar sedikit demi sedikit.
              </p>
            </div>
          </div>
          <button
            className="btn-ghost !px-4 !py-2"
            onClick={() => void listen()}
          >
            <Volume2 size={20} aria-hidden="true" /> Dengarkan
          </button>
          {audioMessage && (
            <p role="status" className="w-full">
              {audioMessage}
            </p>
          )}
        </section>
        {summary.active && (
          <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="small-note font-bold text-brand-700">
                LANJUTKAN LATIHANMU
              </p>
              <h2 className="mt-1">{summary.active.title}</h2>
            </div>
            <Link className="btn-primary !px-5 !py-3" href={activeHref}>
              Lanjutkan <ArrowRight size={20} aria-hidden="true" />
            </Link>
          </section>
        )}
        <section aria-labelledby="activity-title">
          <h2 id="activity-title" className="mb-4">
            Mau belajar apa?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="card flex flex-col gap-4 p-5 sm:p-7">
              <span className="w-fit rounded-2xl bg-brand-100 p-3">
                <Pencil size={28} aria-hidden="true" />
              </span>
              <h3>Membaca & Menulis</h3>
              <p className="text-neutral-700">
                Dengarkan suku kata atau ikuti garis huruf.
              </p>
              <div className="mt-auto flex flex-wrap gap-3">
                <Link
                  href={href("/latihan/membaca")}
                  className="btn-primary !px-5 !py-3"
                >
                  Membaca
                </Link>
                <Link
                  href={href("/latihan/menulis")}
                  className="btn-ghost !px-5 !py-3"
                >
                  Menulis
                </Link>
              </div>
            </article>
            <article className="card flex flex-col gap-4 p-5 sm:p-7">
              <span className="w-fit rounded-2xl bg-accent-100 p-3">
                <BookOpen size={28} aria-hidden="true" />
              </span>
              <h3>Matematika</h3>
              <p className="text-neutral-700">
                Belajar pecahan dan perkalian lewat gambar.
              </p>
              <Link
                href={href("/matematika")}
                className="btn-primary mt-auto self-start !px-5 !py-3"
              >
                Pilih materi <ArrowRight size={20} aria-hidden="true" />
              </Link>
            </article>
          </div>
        </section>
        <LearningRecommendation childId={profile.id} />
        <section
          aria-label="Catatan belajarmu"
          className="card flex flex-wrap justify-between gap-4 p-5"
        >
          <p className="flex items-center gap-2">
            <Star size={22} aria-hidden="true" />
            <strong>{state.totalXp} bintang</strong>
          </p>
          <p className="flex items-center gap-2">
            <Flame size={22} aria-hidden="true" />
            {summary.streak} hari berlatih
          </p>
          <p>{summary.todayCount} latihan hari ini</p>
        </section>
        {summary.recent.length > 0 && (
          <section className="card p-5">
            <h2 className="mb-4">Latihan yang sudah dicoba</h2>
            <ul className="flex flex-col gap-3">
              {summary.recent.map((session) => (
                <li key={session.id}>
                  <Link
                    className="flex items-center justify-between gap-3 rounded-2xl bg-brand-50 p-4"
                    href={href(`/ringkasan/${session.id}`)}
                  >
                    <span>
                      <strong>{session.title}</strong>
                      <span className="small-note mt-1 block text-neutral-700">
                        {evidenceStatus(
                          session.kind,
                          state.evidence[session.id],
                        )}
                      </span>
                    </span>
                    <ArrowRight size={20} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3">
          <p className="small-note text-neutral-600">
            Kamu boleh mengulang dan istirahat kapan saja.
          </p>
          <Link
            href={ROUTES.screening(profile.id)}
            className="small-note rounded-xl px-3 py-3 font-semibold text-brand-700 underline"
          >
            Permainan bunyi dan huruf
          </Link>
        </div>
      </main>
    </div>
  );
}
