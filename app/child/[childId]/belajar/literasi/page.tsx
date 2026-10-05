"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/features/learning/components/icons";
import { learningHref } from "@/features/learning/paths";

export default function LiteracyPage() {
  const { childId } = useParams<{ childId: string }>();
  return (
    <div className="container inner-page">
      <div className="breadcrumbs">
        <Link href={learningHref(childId)}>Beranda</Link>
        <span>/</span>
        <span>Membaca & Menulis</span>
      </div>
      <section className="subject-hero literacy-hero">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-dot" /> MODUL 01
          </span>
          <h1>
            Membaca & Menulis
            <br />
            <em>dengan nyaman.</em>
          </h1>
          <p>
            Pilih kegiatan yang kamu suka. Dengarkan, baca, dan coba menulis
            dengan langkahmu sendiri.
          </p>
        </div>
        <div className="literacy-doodle" aria-hidden="true">
          <span>Aa</span>
          <span>✎</span>
        </div>
      </section>
      <div className="section-heading math-heading">
        <div>
          <span className="section-kicker">DUA CARA BERLATIH</span>
          <h2>Mulai dari mana?</h2>
        </div>
      </div>
      <div className="literacy-cards">
        <Link href={learningHref(childId, "/latihan/membaca")} className="literacy-card">
          <span className="literacy-card-icon reading">Aa</span>
          <span className="section-kicker">DENGARKAN · BACA</span>
          <h3>Latihan Membaca</h3>
          <p>
            Pilih kata atau kalimat pendek. Dengarkan contoh, ikuti teks, lalu
            baca sendiri.
          </p>
          <span className="card-link">
            Mulai membaca <Icon name="arrow" size={17} />
          </span>
        </Link>
        <Link href={learningHref(childId, "/latihan/menulis")} className="literacy-card">
          <span className="literacy-card-icon writing">✎</span>
          <span className="section-kicker">LIHAT · TELUSURI</span>
          <h3>Latihan Menulis</h3>
          <p>
            Telusuri huruf besar A–Z, huruf kecil a–z, dan angka 0–9 di kanvas.
          </p>
          <span className="card-link">
            Mulai menulis <Icon name="arrow" size={17} />
          </span>
        </Link>
      </div>
    </div>
  );
}
