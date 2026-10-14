"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import { learningHref, learningHome } from "@/features/learning/paths";
import {
  resetProgress,
  updateSettings,
  useAppState,
  useStorageStatus,
} from "@/features/learning/state/store";
import { Icon } from "./icons";
import { DEMO_CHILD_ID, ROUTES } from "@/lib/routes";

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings } = useAppState();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal-backdrop"
      aria-labelledby="settings-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), select:not(:disabled), input:not(:disabled), a[href], [tabindex='0']",
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <section className="settings-panel">
        <div className="settings-heading">
          <div>
            <p className="eyebrow">SESUAIKAN CARA BELAJAR</p>
            <h2 id="settings-title">Pengaturan</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            autoFocus
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
            <option value="standard">Biasa</option>
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
            <option value="normal">Biasa</option>
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
        <label className="setting-row">
          <span>
            Kurangi gerakan<small>Tampilan lebih tenang saat belajar</small>
          </span>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(event) =>
              updateSettings({ reducedMotion: event.target.checked })
            }
          />
        </label>
        <button
          className="text-button reset-button"
          onClick={() => {
            if (
              window.confirm(
                "Hapus semua bintang dan catatan belajar pada perangkat ini?",
              )
            ) {
              resetProgress();
              onClose();
            }
          }}
        >
          Hapus catatan belajar pada perangkat ini
        </button>
      </section>
    </dialog>
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
  const demo = childId === DEMO_CHILD_ID;
  const home = learningHome(childId);
  const { settings, totalXp, streak } = useAppState();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const saved = useStorageStatus();
  const literacyActive =
    path.startsWith(learningHref(childId, "/literasi")) ||
    path.startsWith(learningHref(childId, "/latihan"));
  const mathActive =
    path.startsWith(learningHref(childId, "/matematika")) ||
    path.startsWith(learningHref(childId, "/materi"));

  return (
    <MotionConfig reducedMotion={settings.reducedMotion ? "always" : "user"}>
      <div
        data-reduce-motion={settings.reducedMotion}
        className={`site-shell text-${settings.textSize} font-${settings.fontFamily}`}
      >
        <header className="site-header">
          <div className="container header-inner">
            <Link
              href={demo ? ROUTES.learningDemo : `/child/${childId}`}
              className="brand"
              aria-label={demo ? "EJA, ke pilihan demo belajar" : "EJA, ke beranda anak"}
            >
              <svg
                className="brand-mark"
                viewBox="0 0 32 32"
                width="40"
                height="40"
                aria-hidden="true"
                focusable="false"
              >
                <rect width="32" height="32" rx="9" fill="#A855F7" />
                <rect
                  x="9"
                  y="8"
                  width="14"
                  height="3.4"
                  rx="1.7"
                  fill="#fff"
                />
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
                <rect
                  x="9"
                  y="8"
                  width="3.4"
                  height="16"
                  rx="1.7"
                  fill="#fff"
                />
              </svg>
              <span className="brand-name">EJA</span>
            </Link>
            <nav className="top-nav" aria-label="Navigasi utama">
              <Link
                href={home}
                aria-label="Beranda belajar"
                className={path === home ? "active" : ""}
              >
                <Icon name="home" size={18} />
                <span>Beranda</span>
              </Link>
              <Link
                href={learningHref(childId, "/literasi")}
                aria-label="Membaca dan menulis"
                className={literacyActive ? "active" : ""}
              >
                <Icon name="book" size={18} />
                <span>Baca & Tulis</span>
              </Link>
              <Link
                href={learningHref(childId, "/matematika")}
                aria-label="Matematika"
                className={mathActive ? "active" : ""}
              >
                <Icon name="spark" size={18} />
                <span>Matematika</span>
              </Link>
            </nav>
            <div className="header-actions">
              <span className="header-xp">
                <Icon name="star" size={17} />
                {totalXp} bintang
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
        <a className="skip-learning" href="#learning-main">
          Langsung ke kegiatan
        </a>
        {demo && (
          <div className="container demo-learning-bar" aria-label="Demo belajar">
            <p>Demo belajar · Catatan hanya di browser ini.</p>
            <Link href={ROUTES.learningDemo}>Pilih kegiatan lain <span aria-hidden="true">→</span></Link>
          </div>
        )}
        {!saved && (
          <p className="storage-warning" role="alert">
            Catatan belum tersimpan pada perangkat ini. Jangan tutup halaman
            dulu. Minta bantuan orang tua untuk mengaktifkan penyimpanan
            browser.
          </p>
        )}
        <main id="learning-main" tabIndex={-1}>
          {children}
        </main>
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
        {settingsOpen && (
          <SettingsPanel onClose={() => setSettingsOpen(false)} />
        )}
      </div>
    </MotionConfig>
  );
}
