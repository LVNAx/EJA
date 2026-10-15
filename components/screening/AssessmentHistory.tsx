"use client";
import { useState } from "react";
import { useAssessmentHistory } from "@/lib/screening/assessment-store";
import type { AssessmentRecord } from "@/lib/screening/assessment";
import { AssessmentReport } from "./AssessmentReport";
import "./assessment.css";

const EMPTY: AssessmentRecord[] = [];
export function AssessmentHistory({
  childId,
  serverRecords = EMPTY,
}: {
  childId: string;
  serverRecords?: AssessmentRecord[];
}) {
  const local = useAssessmentHistory(childId),
    [selected, setSelected] = useState("");
  const records = Array.from(
    new Map([...local, ...serverRecords].map((r) => [r.id, r])).values(),
  ).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  if (!records.length) return null;
  const record = records.find((r) => r.id === selected) ?? records[0];
  return (
    <div className="assessment-parent-history">
      {records.length > 1 && (
        <label className="assessment-history-picker">
          Sesi kegiatan
          <select
            value={record.id}
            onChange={(e) => setSelected(e.target.value)}
          >
            {records.map((r) => (
              <option key={r.id} value={r.id}>
                {new Date(r.completedAt).toLocaleString("id-ID")}
              </option>
            ))}
          </select>
        </label>
      )}
      <AssessmentReport record={record} />
      <p className="assessment-helper">
        {serverRecords.some((r) => r.id === record.id)
          ? "Catatan tersimpan pada akun."
          : "Catatan tersimpan pada browser ini."}
      </p>
    </div>
  );
}
