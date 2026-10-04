"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { learningHref, learningHome } from "@/features/learning/paths";
import { resetProgress, updateSettings, useAppState } from "@/features/learning/state/store";
import { Icon } from "./icons";

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings } = useAppState();
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="settings-heading">
          <div>
            <p className="eyebrow">SESUAIKAN CARA BELAJAR</p>
            <h2 id="settings-title">Pengaturan</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
          >
            ×
          </button>
        </div>
        <label className="setting-row">
          <span>
            Jenis huruf<small>Pilih yang paling nyaman untukmu</small>
          </span>
          <select
            value={settings.fontFamily}
            onChange={(event) =>
              updateSettings({
                fontFamily: event.target.value as "standard" | "opendyslexic",
              })
            }
          >
            <option value="standard">Standar</option>
            <option value="opendyslexic">OpenDyslexic</option>
          </select>
        </label>
        <label className="setting-row">
          <span>
            Ukuran teks<small>Pilih yang paling nyaman dibaca</small>
          </span>
          <select
            value={settings.textSize}
            onChange={(event) =>
              updateSettings({
                textSize: event.target.value as "normal" | "large",
              })
            }
          >
            <option value="normal">Normal</option>
            <option value="large">Besar</option>
          </select>
        </label>
        <label className="setting-row">
          <span>
            Kecepatan suara<small>Bisa diubah kapan saja</small>
          </span>
          <select
            value={settings.audioRate}
            onChange={(event) =>
              updateSettings({ audioRate: Number(event.target.value) })
            }
          >
            <option value={0.7}>Pelan</option>
            <option value={0.9}>Sedang</option>
            <option value={1.1}>Cepat</option>
          </select>
        </label>
        <label className="setting-row">
          <span>
            Suara apresiasi<small>Bunyi singkat saat jawaban benar</small>
          </span>
          <input
            type="checkbox"
            checked={settings.rewardSound}
            onChange={(event) =>
              updateSettings({ rewardSound: event.target.checked })
            }
          />
        </label>
        <button
          className="text-button reset-button"
          onClick={() => {
            if (
              window.confirm(
                "Hapus semua XP, streak, dan kemajuan belajar di browser ini?",
              )
            ) {
              resetProgress();
              onClose();
            }
          }}
        >
          Hapus data belajar di browser ini
        </button>
      </section>
    </div>
  );
}

export function AppShell({
  children,
  childId,
}: {
  children: React.ReactNode;
  childId: string;
}) {
  const path = usePathname();
  const home = learningHome(childId);
  const { settings, totalXp, streak } = useAppState();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const literacyActive =
    path.startsWith(learningHref(childId, "/literasi")) ||
    path.startsWith(learningHref(childId, "/latihan"));
  const mathActive =
    path.startsWith(learningHref(childId, "/matematika")) ||
    path.startsWith(learningHref(childId, "/materi"));

  return (
    <div
      className={`site-shell text-${settings.textSize} font-${settings.fontFamily}`}
    >
      <header className="site-header">
        <div className="container header-inner">
          <Link href={`/child/${childId}`} className="brand" aria-label="EJA, ke beranda anak">
            <svg
              className="brand-mark"
              viewBox="0 0 32 32"
              width="40"
              height="40"
              aria-hidden="true"
              focusable="false"
            >
              <rect width="32" height="32" rx="9" fill="#A855F7" />
              <rect x="9" y="8" width="14" height="3.4" rx="1.7" fill="#fff" />
              <rect
                x="9"
                y="14.3"
                width="10"
                height="3.4"
                rx="1.7"
                fill="#FF8C61"
              />
              <rect
                x="9"
                y="20.6"
                width="14"
                height="3.4"
                rx="1.7"
                fill="#fff"
              />
              <rect x="9" y="8" width="3.4" height="16" rx="1.7" fill="#fff" />
            </svg>
            <span className="brand-name">EJA</span>
          </Link>
          <nav className="top-nav" aria-label="Navigasi utama">
            <Link href={home} className={path === home ? "active" : ""}>
              <Icon name="home" size={18} />
              <span>Beranda</span>
            </Link>
            <Link href={learningHref(childId, "/literasi")} className={literacyActive ? "active" : ""}>
              <Icon name="book" size={18} />
              <span>Baca & Tulis</span>
            </Link>
            <Link href={learningHref(childId, "/matematika")} className={mathActive ? "active" : ""}>
              <Icon name="spark" size={18} />
              <span>Matematika</span>
            </Link>
          </nav>
          <div className="header-actions">
            <span className="header-xp">
              <Icon name="star" size={17} />
              {totalXp} XP
            </span>
            <button
              className="icon-button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Buka pengaturan"
            >
              <Icon name="settings" size={21} />
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <span>
            <strong>EJA</strong> · Belajar sedikit demi sedikit.
          </span>
          <span>
            {streak > 0
              ? `${streak} hari belajar beruntun ✨`
              : "Setiap langkah berarti ✨"}
          </span>
        </div>
      </footer>
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
