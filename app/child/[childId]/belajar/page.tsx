"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/features/learning/components/icons";
import { lessons } from "@/features/learning/math/content";
import { LessonCard } from "@/features/learning/math/lesson-card";
import { useAppState } from "@/features/learning/state/store";
import { learningHref } from "@/features/learning/paths";

export default function HomePage() {
  const { childId } = useParams<{ childId: string }>();
  const state = useAppState();
  const resume = Object.entries(state.lessons).find(
    ([, progress]) => progress.activeSessionId,
  );
  const resumeLesson = resume
    ? lessons.find((lesson) => lesson.id === resume[0])
    : null;

  return (
    <div className="container page-home">
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow hero-eyebrow">
            <span className="eyebrow-dot" /> TEMAN BELAJARMU
          </span>
          <h1>
            Belajar jadi lebih <em>menyenangkan.</em>
          </h1>
          <p>
            Ayo membaca, menulis, dan memahami Matematika dengan langkah kecil
            yang jelas.
          </p>
          <div className="hero-buttons">
            <Link className="button button-primary" href={learningHref(childId, "/literasi")}>
              <Icon name="book" /> Mulai Membaca & Menulis{" "}
              <Icon name="arrow" size={18} />
            </Link>
            <Link className="button button-light" href={learningHref(childId, "/matematika")}>
              Lihat Matematika
            </Link>
          </div>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <div className="sun-shape" />
          <div className="hero-notebook">
            <span className="notebook-spiral">◦ ◦ ◦ ◦</span>
            <span className="notebook-equation">
              A <span>+</span> 1 <span>✦</span>
            </span>
            <span className="notebook-lines" />
          </div>
          <span className="hero-spark spark-one">✦</span>
          <span className="hero-spark spark-two">✳</span>
          <div className="hero-pencil">
            <span />
          </div>
        </div>
      </section>

      <section className="overview-row" aria-label="Pencapaian belajar">
        <div className="overview-intro">
          <span className="section-kicker">LANGKAH KECIL, HASIL BESAR</span>
          <h2>Perjalanan belajarmu</h2>
          <p>Setiap kali belajar, kamu makin mengenal hal baru.</p>
        </div>
        <div className="stat-card xp-stat">
          <span className="stat-icon">
            <Icon name="star" size={24} />
          </span>
          <div>
            <strong>{state.totalXp}</strong>
            <span>Total XP</span>
          </div>
        </div>
        <div className="stat-card streak-stat">
          <span className="stat-icon">✦</span>
          <div>
            <strong>{state.streak} hari</strong>
            <span>Belajar beruntun</span>
          </div>
        </div>
      </section>

      <section className="section modules-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">PILIH MODULMU</span>
            <h2>Mau belajar apa hari ini?</h2>
          </div>
        </div>
        <div className="module-grid">
          <div className="module-card literacy-module">
            <div className="module-symbol">Aa</div>
            <span className="section-kicker">MODUL 01</span>
            <h3>Membaca & Menulis</h3>
            <p>
              Dengarkan kata, baca dengan nyaman, lalu telusuri bentuk huruf dan
              angka.
            </p>
            <div className="module-actions">
              <Link href={learningHref(childId, "/latihan/membaca")} className="button button-primary">
                Latihan Membaca <Icon name="arrow" size={17} />
              </Link>
              <Link href={learningHref(childId, "/latihan/menulis")} className="button button-outline">
                Latihan Menulis
              </Link>
            </div>
          </div>
          <div className="module-card math-module">
            <div className="module-symbol">¼</div>
            <span className="section-kicker">MODUL 02</span>
            <h3>Matematika</h3>
            <p>
              Pahami pecahan dan perkalian melalui gambar, cerita pendek, dan
              kuis.
            </p>
            <div className="module-actions">
              <Link href={learningHref(childId, "/matematika")} className="button button-primary">
                Lihat Materi <Icon name="arrow" size={17} />
              </Link>
              {resumeLesson && (
                <Link
                  href={learningHref(childId, `/materi/${resumeLesson.id}`)}
                  className="button button-outline"
                >
                  Lanjutkan
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section lessons-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">MATEMATIKA</span>
            <h2>Materi yang tersedia</h2>
          </div>
          <Link href={learningHref(childId, "/matematika")} className="text-link">
            Lihat semua materi <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="lesson-grid">
          {lessons.map((lesson) => {
            const progress = state.lessons[lesson.id];
            const status = progress?.activeSessionId
              ? "Sedang berjalan"
              : progress?.completed
                ? "Selesai"
                : "Belum mulai";
            return (
              <LessonCard key={lesson.id} lesson={lesson} status={status} childId={childId} />
            );
          })}
        </div>
      </section>
      <section className="gentle-note">
        <span className="note-icon">✦</span>
        <div>
          <h2>Belajar dengan caramu sendiri</h2>
          <p>
            Kamu boleh mendengar ulang, kembali ke langkah sebelumnya, dan
            mencoba lagi kapan saja.
          </p>
        </div>
      </section>
    </div>
  );
}
