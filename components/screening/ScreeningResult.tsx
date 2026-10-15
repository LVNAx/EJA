"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FontSelector } from "@/components/accessibility/FontSelector";
import { Logo } from "@/components/site/Logo";
import {
  assessmentRecordSchema,
  type AssessmentRecord,
} from "@/lib/screening/assessment";
import { useAssessmentHistory } from "@/lib/screening/assessment-store";
import { AssessmentReport } from "./AssessmentReport";
import "./assessment.css";

export function DemoResult({ childId }: { childId: string }) {
  const history = useAssessmentHistory(childId);
  const [session, setSession] = useState<{
      childId: string;
      record: AssessmentRecord | null;
    } | null>(null),
    [loaded, setLoaded] = useState("");
  useEffect(() => {
    try {
      const parsed = assessmentRecordSchema.safeParse(
        JSON.parse(
          sessionStorage.getItem(`eja-assessment-result:${childId}`) ?? "null",
        ),
      );
      setSession({ childId, record: parsed.success ? parsed.data : null });
    } catch {
      setSession({ childId, record: null });
    }
    setLoaded(childId);
  }, [childId]);
  const record =
    (session?.childId === childId ? session.record : null) ?? history[0];
  return (
    <div className="assessment-shell">
      <header className="assessment-header">
        <Logo />
        <FontSelector />
      </header>
      <main className="assessment-main assessment-main-wide" id="main">
        <Link className="assessment-back" href="/demo/belajar">
          ← Pilihan kegiatan
        </Link>
        {loaded !== childId ? (
          <p role="status">Memuat catatan…</p>
        ) : record ? (
          <>
            <AssessmentReport record={record} />
            <div className="assessment-two">
              <Link
                className="assessment-primary"
                href={`/screening/${childId}`}
              >
                Ulangi kegiatan
              </Link>
              <Link className="assessment-secondary" href="/demo/belajar">
                Lanjut belajar
              </Link>
            </div>
            <p className="assessment-helper">
              Demo · Catatan tersimpan pada browser ini.
            </p>
          </>
        ) : (
          <section className="assessment-card">
            <h1>Belum ada catatan tes baru</h1>
            <Link className="assessment-primary" href={`/screening/${childId}`}>
              Mulai kegiatan
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
