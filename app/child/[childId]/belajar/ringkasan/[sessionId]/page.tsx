"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/features/learning/components/icons";
import {
  useAppState,
  useBrowserReady,
  useStorageStatus,
} from "@/features/learning/state/store";
import { evidenceStatus } from "@/features/learning/state/evidence";
import { learningHref } from "@/features/learning/paths";

export default function SummaryPage() {
  const { childId, sessionId } = useParams<{
    childId: string;
    sessionId: string;
  }>();
  const state = useAppState();
  const ready = useBrowserReady();
  const saved = useStorageStatus();
  if (!ready)
    return (
      <div className="container loading-page" role="status">
        Memuat catatan latihan...
      </div>
    );
  const session = state.sessions[sessionId];
  if (!session?.completedAt)
    return (
      <div className="container not-found">
        <h1>Ringkasan belum tersedia</h1>
        <p>
          Selesaikan kegiatan belajar terlebih dahulu untuk melihat
          ringkasannya.
        </p>
        <Link className="button button-primary" href={learningHref(childId)}>
          Ke Beranda
        </Link>
      </div>
    );

  const againHref = learningHref(
    childId,
    session.kind === "math" ? "/matematika" : "/literasi",
  );
  return (
    <div className="container summary-page">
      <div className="summary-confetti" aria-hidden="true">
        ✦ <span>●</span> ✳ <span>◆</span> ✦
      </div>
      <div className="summary-card">
        <div className="summary-medal">
          <Icon name="star" size={40} />
        </div>
        <span className="section-kicker">TERIMA KASIH SUDAH BERLATIH</span>
        <h1>
          Kamu sudah
          <br />
          <em>mencoba!</em>
        </h1>
        <p className="summary-lead">
          Kamu sudah berlatih <strong>{session.title}</strong>. Kamu boleh
          mengulang kapan saja.
        </p>
        <div className="summary-stats">
          <div>
            <span>Bintang latihan ini</span>
            <strong>+{session.xpEarned} bintang</strong>
          </div>
          <div>
            <span>Belajar beruntun</span>
            <strong>{state.streak} hari</strong>
          </div>
        </div>
        <p className="assistive-note" role="status">
          {saved
            ? "Catatan tersimpan pada perangkat ini."
            : "Catatan belum tersimpan. Jangan tutup halaman dulu."}
        </p>
        <p className="assistive-note">
          {evidenceStatus(session.kind, state.evidence[session.id])}
        </p>
        <div className="summary-learned">
          <h2>Yang kamu lakukan</h2>
          <ul>
            {session.learned.map((item) => (
              <li key={item}>
                <Icon name="check" size={17} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="summary-actions">
          <Link href={againHref} className="button button-primary">
            Belajar Lagi <Icon name="arrow" size={18} />
          </Link>
          <Link href={learningHref(childId)} className="button button-outline">
            <Icon name="home" size={18} /> Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
