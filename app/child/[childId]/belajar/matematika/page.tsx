"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { LessonCard } from "@/features/learning/math/lesson-card";
import { Icon } from "@/features/learning/components/icons";
import { lessons } from "@/features/learning/math/content";
import { useAppState } from "@/features/learning/state/store";
import { learningHref } from "@/features/learning/paths";

export default function MathPage() {
  const { childId } = useParams<{ childId: string }>();
  const state = useAppState();
  return (
    <div className="container inner-page">
      <div className="breadcrumbs">
        <Link href={learningHref(childId)}>Beranda</Link>
        <span>/</span>
        <span>Matematika</span>
      </div>
      <section className="subject-hero">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-dot" /> AYO JELAJAHI
          </span>
          <h1>
            Matematika bisa
            <br />
            <em>jadi seru!</em>
          </h1>
          <p>
            Pilih satu materi. Kita belajar pelan-pelan dengan gambar dan suara.
          </p>
        </div>
        <div className="subject-doodle" aria-hidden="true">
          <span>⅟₄</span>
          <span>×</span>
          <span>✦</span>
        </div>
      </section>
      <div className="section-heading math-heading">
        <div>
          <span className="section-kicker">MATERI PILIHAN</span>
          <h2>Mau belajar apa hari ini?</h2>
        </div>
        <span className="count-badge">{lessons.length} materi tersedia</span>
      </div>
      <div className="lesson-grid">
        {lessons.map((lesson) => {
          const progress = state.lessons[lesson.id];
          const status = progress?.activeSessionId
            ? "Sedang berjalan"
            : progress?.completed
              ? "Selesai"
              : "Belum mulai";
          return <LessonCard key={lesson.id} lesson={lesson} status={status} childId={childId} />;
        })}
      </div>
      <div className="coming-note">
        <span className="coming-icon">
          <Icon name="spark" size={22} />
        </span>
        <div>
          <h3>Materi lain akan segera datang</h3>
          <p>
            Untuk sekarang, coba dua materi ini dulu. Cerita penjumlahan dan
            topik lain akan ditambahkan setelah pengujian.
          </p>
        </div>
      </div>
    </div>
  );
}
