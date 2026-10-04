"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Check, Flame, FlaskConical, HeartHandshake, Lock, Mic, Pencil, Settings, Star, Trophy, Volume2 } from "lucide-react";
import { AuroraBackground } from "@/components/screening/AuroraBackground";
import { Illustration } from "@/components/screening/Illustration";
import { LogoMark } from "@/components/site/Logo";
import { isAvatar } from "@/lib/avatars";
import type { ChildProfile } from "@/lib/dashboard/types";
import { ROUTES } from "@/lib/routes";
import { speak, stopSpeaking } from "@/lib/screening/tts";
import { lessons } from "@/features/learning/math/content";
import { learningHref } from "@/features/learning/paths";
import { updateSettings, useAppState } from "@/features/learning/state/store";
import { childSummary } from "@/lib/child/summary";

export function ChildDashboard({ profile, demo }: { profile: ChildProfile; demo: boolean }) {
  const state = useAppState();
  const [now, setNow] = useState<Date | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => { setNow(new Date()); return () => stopSpeaking(); }, []);
  const summary = childSummary(state, now ?? new Date(0));
  const href = (path: string) => learningHref(profile.id, path);
  const activeHref = summary.active?.kind === "math"
    ? href(`/materi/${summary.active.activityId}`)
    : href(`/latihan/${summary.active?.kind === "writing" ? "menulis" : "membaca"}`);
  const nextLesson = lessons.find((lesson) => !state.lessons[lesson.id]?.completed) ?? lessons[0];
  const earlyGrade = profile.grade !== null && profile.grade <= 3;
  const mainHref = summary.active ? activeHref : earlyGrade ? href("/literasi") : href(`/materi/${nextLesson.id}`);
  const title = summary.active?.title ?? (earlyGrade ? "Membaca dan menulis" : nextLesson.title);
  const mathBadge = summary.completedLessons === lessons.length;

  return (
    <div className="min-h-screen pb-10" style={{ fontFamily: state.settings.fontFamily === "opendyslexic" ? "var(--font-open-dyslexic), sans-serif" : undefined, fontSize: state.settings.textSize === "large" ? "1.25rem" : "1.125rem" }}>
      <AuroraBackground />
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5">
        <Link href={ROUTES.childHome(profile.id)} aria-label="EJA, beranda anak" className="flex items-center gap-3"><LogoMark size={42} /><span className="text-2xl font-bold">EJA</span><span className="hidden rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-brand-700 sm:block">Dunia belajarmu</span></Link>
        <div className="flex items-center gap-2">
          <button aria-expanded={settingsOpen} aria-controls="child-settings" onClick={() => setSettingsOpen(!settingsOpen)} className="btn-ghost min-h-12 px-4"><Settings size={20} aria-hidden="true" /><span className="hidden sm:inline">Atur tampilan</span><span className="sr-only sm:hidden">Atur tampilan</span></button>
          <Link href="/unlock" className="btn-ghost min-h-12 px-4 text-sm"><Lock size={16} aria-hidden="true" /> Orang tua</Link>
        </div>
      </header>
      <main id="main" className="mx-auto flex max-w-6xl flex-col gap-6 px-4">
        {demo && <p className="text-sm text-brand-700">Mode demo · Profil contoh. Progres berasal dari aktivitasmu di browser ini.</p>}
        {settingsOpen && <section id="child-settings" aria-label="Atur tampilan" className="card grid gap-5 p-6 sm:grid-cols-3">
          <label className="flex flex-col gap-2 font-bold">Ukuran huruf<select className="min-h-12 rounded-xl border border-brand-200 bg-white p-2" value={state.settings.textSize} onChange={(e) => updateSettings({ textSize: e.target.value as "normal" | "large" })}><option value="normal">Normal</option><option value="large">Besar</option></select></label>
          <label className="flex flex-col gap-2 font-bold">Jenis huruf<select className="min-h-12 rounded-xl border border-brand-200 bg-white p-2" value={state.settings.fontFamily} onChange={(e) => updateSettings({ fontFamily: e.target.value as "standard" | "opendyslexic" })}><option value="standard">Standar</option><option value="opendyslexic">OpenDyslexic</option></select></label>
          <label className="flex flex-col gap-2 font-bold">Kecepatan suara<select className="min-h-12 rounded-xl border border-brand-200 bg-white p-2" value={state.settings.audioRate} onChange={(e) => updateSettings({ audioRate: Number(e.target.value) })}><option value={0.7}>Pelan</option><option value={0.9}>Sedang</option><option value={1.1}>Cepat</option></select></label>
        </section>}
        <section className="card flex flex-wrap items-center justify-between gap-6 p-6 md:p-8">
          <div className="flex items-center gap-4">
            <span className="rounded-3xl bg-white/80 p-3"><Illustration name={isAvatar(profile.avatar) ? profile.avatar : "kucing"} size={80} /></span>
            <div><p className="mb-1 text-sm font-bold text-brand-700">{profile.grade ? `KELAS ${profile.grade}` : "TEMAN BELAJAR"}</p><h1 className="text-3xl font-bold md:text-4xl">Halo, {profile.name}!</h1><p className="mt-2 text-neutral-700">Ayo belajar satu langkah lagi.</p></div>
          </div>
          <button className="btn-ghost min-h-12 px-4" onClick={() => void speak(`Halo, ${profile.name}! Ayo belajar satu langkah lagi. Pilih belajar, menulis, berbicara, atau main permainan.`, state.settings.audioRate)}><Volume2 size={22} aria-hidden="true" /> Dengarkan</button>
        </section>
        <section aria-label="Pencapaianmu" className="grid gap-3 sm:grid-cols-3">
          {[{ icon: Star, value: `${state.totalXp} XP`, label: "Bintang belajarmu", color: "bg-accent-100" }, { icon: Flame, value: `${summary.streak} hari`, label: "Belajar beruntun", color: "bg-brand-100" }, { icon: Check, value: `${summary.completed.length} sesi`, label: "Aktivitas selesai", color: "bg-success-50" }].map(({ icon: Icon, value, label, color }) => <div key={label} className="card flex items-center gap-4 p-5"><span className={`rounded-2xl p-3 ${color}`}><Icon size={28} aria-hidden="true" /></span><div><strong className="block text-2xl">{value}</strong><span className="text-neutral-700">{label}</span></div></div>)}
        </section>
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <section className="card flex flex-col gap-4 p-6 lg:col-span-2 md:p-8" aria-labelledby="continue-title">
            <p className="text-sm font-bold text-brand-700">{summary.active ? "LANJUTKAN PETUALANGAN" : "LANGKAH BERIKUTNYA"}</p>
            <h2 id="continue-title" className="text-2xl font-bold">{title}</h2>
            <p className="text-neutral-700">Dengarkan. Lihat gambarnya. Coba satu langkah.</p>
            <Link href={mainHref} className="btn-primary self-start">{summary.active ? "Lanjutkan" : "Ayo belajar"}<ArrowRight size={22} aria-hidden="true" /></Link>
          </section>
          <section className="card flex flex-col gap-3 p-6" aria-labelledby="goal-title"><span className="w-fit rounded-2xl bg-accent-100 p-3"><Illustration name="roket" size={48} /></span><h2 id="goal-title" className="text-xl font-bold">Langkah kecil hari ini</h2><p>{summary.todayCount > 0 ? "Hebat! Kamu sudah menyelesaikan aktivitas hari ini." : "Coba selesaikan satu aktivitas. Kamu boleh istirahat kapan saja."}</p><p className="font-bold text-brand-700">{summary.todayCount} aktivitas selesai hari ini</p></section>
        </div>
        <section aria-labelledby="activity-title"><h2 id="activity-title" className="mb-4 text-2xl font-bold">Mau mencoba apa?</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[{ icon: BookOpen, title: "Belajar", text: "Gambar, suara, dan kuis.", url: href(""), color: "bg-brand-100" }, { icon: Pencil, title: "Menulis", text: "Ikuti garis huruf dan angka.", url: href("/latihan/menulis"), color: "bg-accent-100" }, { icon: Mic, title: "Berbicara", text: "Dengar dan ucapkan suku kata.", url: href("/latihan/membaca"), color: "bg-success-50" }, { icon: Trophy, title: "Main permainan", text: "Coba empat permainan seru.", url: ROUTES.screening(profile.id), color: "bg-brand-100" }].map(({ icon: Icon, title, text, url, color }) => <Link key={title} href={url} className="card flex flex-col gap-3 p-6 transition-transform hover:-translate-y-1"><span className={`w-fit rounded-2xl p-3 ${color}`}><Icon size={30} aria-hidden="true" /></span><h3 className="text-xl font-bold">{title}</h3><p className="text-neutral-700">{text}</p><ArrowRight size={22} aria-hidden="true" /></Link>)}
        </div></section>
        <section aria-labelledby="subjects-title"><h2 id="subjects-title" className="mb-4 text-2xl font-bold">Pelajaran sekolah</h2><div className="grid gap-4 sm:grid-cols-3">
          <Link href={href("/matematika")} className="card flex items-center gap-4 p-6"><span className="rounded-2xl bg-accent-100 p-4 text-3xl font-bold" aria-hidden="true">¼</span><div><h3 className="text-xl font-bold">Matematika</h3><p className="text-neutral-700">2 materi · Kelas 4–6</p></div></Link>
          {[{ icon: FlaskConical, title: "IPA" }, { icon: HeartHandshake, title: "Pancasila" }].map(({ icon: Icon, title }) => <div key={title} className="card flex items-center gap-4 p-6"><span className="rounded-2xl bg-white/70 p-4"><Icon size={28} aria-hidden="true" /></span><div><h3 className="text-xl font-bold">{title}</h3><p className="text-neutral-700">Segera hadir</p></div></div>)}
        </div></section>
        <section className="card p-6 md:p-8" aria-labelledby="path-title"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 id="path-title" className="text-2xl font-bold">Perjalanan Matematika</h2><p className="mt-1 text-neutral-700">{summary.completedLessons} dari {lessons.length} materi selesai · Kelas 4–6</p></div><BookOpen size={28} className="text-brand-700" aria-hidden="true" /></div>
          <ol className="grid gap-4 sm:grid-cols-2">{lessons.map((lesson, index) => { const progress = state.lessons[lesson.id]; return <li key={lesson.id}><Link href={href(`/materi/${lesson.id}`)} className="flex h-full items-center gap-4 rounded-2xl border border-brand-200 bg-white/80 p-5 hover:bg-brand-50"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold ${progress?.completed ? "bg-success-50 text-success-700" : "bg-brand-100 text-brand-700"}`}>{progress?.completed ? <Check aria-label="Selesai" /> : index + 1}</span><div><h3 className="font-bold">{lesson.title}</h3><p className="mt-1 text-neutral-700">{progress?.activeSessionId ? "Lanjutkan" : progress?.completed ? "Selesai · Coba lagi" : "Siap dicoba"} · {lesson.durationMinutes} menit</p></div></Link></li>; })}</ol>
        </section>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="card p-6" aria-labelledby="badges-title"><h2 id="badges-title" className="mb-4 text-2xl font-bold">Lencana belajarmu</h2><div className="flex flex-col gap-3">{[{ title: "Langkah Pertama", detail: "Kumpulkan 50 XP", earned: state.badges.includes("Langkah Pertama") }, { title: "Petualang Matematika", detail: "Selesaikan dua materi Matematika", earned: mathBadge }].map((badge) => <div key={badge.title} className={`flex items-center gap-4 rounded-2xl p-4 ${badge.earned ? "bg-accent-100" : "bg-white/60"}`}><Trophy size={28} aria-hidden="true" /><div><h3 className="font-bold">{badge.title}</h3><p className="text-neutral-700">{badge.earned ? "Berhasil diraih!" : badge.detail}</p></div></div>)}</div></section>
          <section className="card p-6" aria-labelledby="recent-title"><h2 id="recent-title" className="mb-4 text-2xl font-bold">Yang sudah kamu coba</h2>{summary.recent.length === 0 ? <p className="text-neutral-700">Belum ada aktivitas selesai. Yuk, coba langkah pertamamu!</p> : <ul className="flex flex-col gap-3">{summary.recent.map((session) => <li key={session.id}><Link className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 p-4" href={href(`/ringkasan/${session.id}`)}><span><strong className="block">{session.title}</strong><span className="text-neutral-700">+{session.xpEarned} XP</span></span><ArrowRight size={20} aria-hidden="true" /></Link></li>)}</ul>}</section>
        </div>
        <p className="text-center text-sm text-neutral-600">Progres belajar tersimpan di browser ini. Belajar sedikit demi sedikit.</p>
      </main>
    </div>
  );
}
