import { describe, expect, it } from "vitest";
import type { AppState, Session } from "../state/store";
import { evidenceSchema } from "../state/evidence";
import {
  buildProgressModel,
  MODEL_CONFIG,
  recommendPractice,
} from "./progress-model";
import { progressDemoData } from "./demo-data";

function writingHistory(
  scores: number[],
): Pick<AppState, "sessions" | "evidence"> {
  const sessions: Record<string, Session> = {};
  const evidence: AppState["evidence"] = {};
  scores.forEach((score, i) => {
    const id = `session-${i}`;
    const at = new Date(Date.UTC(2026, 0, i + 1)).toISOString();
    sessions[id] = {
      id,
      kind: "writing",
      activityId: "A",
      title: "Menulis A",
      startedAt: at,
      completedAt: at,
      xpEarned: 0,
      learned: [],
    };
    evidence[id] = evidenceSchema.parse({ writingScores: [score] });
  });
  return { sessions, evidence };
}

describe("model perkembangan Beta–Bernoulli", () => {
  it("tidak menampilkan prediksi dari prior ketika belum ada hasil", () => {
    const model = buildProgressModel({ sessions: {}, evidence: {} });
    expect(model.assessedSessions).toBe(0);
    expect(model.skills).toHaveLength(4);
    expect(
      model.skills.every(
        (skill) =>
          skill.probability === null &&
          skill.interval === null &&
          !skill.enoughData,
      ),
    ).toBe(true);
    expect(recommendPractice(model.skills).skill.id).toBe("reading");
  });

  it("memperbarui posterior dari hasil nyata dan menghitung interval Beta yang benar", () => {
    const success = buildProgressModel(writingHistory([80])).skills[1];
    expect(success.alpha).toBe(2);
    expect(success.beta).toBe(1);
    expect(success.probability).toBeCloseTo(2 / 3);
    // For Beta(2,1), CDF(x)=x²: q(0.05)=sqrt(0.05).
    expect(success.interval![0]).toBeCloseTo(Math.sqrt(0.05), 8);
    expect(success.interval![1]).toBeCloseTo(Math.sqrt(0.95), 8);
    const failure = buildProgressModel(writingHistory([20])).skills[1];
    expect(failure.probability).toBeCloseTo(1 / 3);
    expect(failure.interval![0]).toBeCloseTo(1 - Math.sqrt(0.95), 8);
    expect(failure.interval![1]).toBeCloseTo(1 - Math.sqrt(0.05), 8);
    expect(
      buildProgressModel(writingHistory([80, 90])).skills[1].probability,
    ).toBeGreaterThan(success.probability!);
    expect(
      buildProgressModel(writingHistory([80, 20])).skills[1].probability,
    ).toBeLessThan(success.probability!);
  });

  it("menunggu tiga sesi sebelum perkiraan ditampilkan dan tidak membuat tren dari dua sesi", () => {
    const two = buildProgressModel(writingHistory([80, 80])).skills[1];
    expect(two.enoughData).toBe(false);
    expect(two.trend).toBe("insufficient");
    expect(
      buildProgressModel(writingHistory([80, 80, 80])).skills[1].enoughData,
    ).toBe(true);
  });

  it("mendeteksi perubahan dari dua kelompok tiga sesi", () => {
    expect(
      buildProgressModel(writingHistory([30, 40, 50, 70, 80, 90])).skills[1]
        .trend,
    ).toBe("improving");
    expect(
      buildProgressModel(writingHistory([80, 80, 80, 20, 20, 20])).skills[1]
        .trend,
    ).toBe("mixed");
    expect(
      buildProgressModel(writingHistory([80, 80, 20, 20, 80, 80])).skills[1]
        .trend,
    ).toBe("steady");
  });

  it("menggunakan hasil tulisan terakhir satu kali; bantuan dan percobaan ulang bukan hasil tambahan", () => {
    const state = writingHistory([10]);
    state.evidence["session-0"] = evidenceSchema.parse({
      writingScores: [0, 20, 90],
      hints: 5,
      audioPlays: 7,
    });
    const skill = buildProgressModel(state).skills[1];
    expect(skill.alpha).toBe(2);
    expect(skill.beta).toBe(1);
    expect(skill.history).toHaveLength(1);
    expect(skill.history[0]).toMatchObject({
      hints: 5,
      audioPlays: 7,
      success: true,
    });
    expect(buildProgressModel(state)).toEqual(buildProgressModel(state));
  });

  it("mengabaikan sesi belum selesai, sesi tanpa hasil, dan waktu yang tidak valid", () => {
    const state = writingHistory([80, 80, 80]);
    state.sessions["session-0"].completedAt = null;
    delete state.evidence["session-1"];
    state.sessions["session-2"].completedAt = "invalid";
    const model = buildProgressModel(state);
    expect(model.assessedSessions).toBe(0);
    expect(model.unassessedSessions).toBe(1);
  });

  it("membaca mandiri dan mendengarkan contoh tidak dihitung gagal atau berhasil oleh model", () => {
    const state = writingHistory([80]);
    state.sessions["session-0"].kind = "reading";
    state.evidence["session-0"] = evidenceSchema.parse({
      selfRead: true,
      audioPlays: 3,
    });
    expect(buildProgressModel(state).skills[0].probability).toBeNull();
    state.evidence["session-0"] = evidenceSchema.parse({
      readingAttempts: 2,
      readingMatches: 1,
    });
    expect(buildProgressModel(state).skills[0].probability).toBeCloseTo(2 / 3);
    state.evidence["session-0"] = evidenceSchema.parse({
      readingAttempts: 2,
      readingMatches: 0,
    });
    expect(buildProgressModel(state).skills[0].probability).toBeCloseTo(1 / 3);
  });

  it("kuis yang akhirnya benar tetap menunjukkan kesulitan pada percobaan pertama", () => {
    const state = writingHistory([80, 80]);
    for (let i = 0; i < 2; i++) {
      state.sessions[`session-${i}`].kind = "math";
      state.sessions[`session-${i}`].activityId = i
        ? "perkalian-kelompok"
        : "pecahan-dasar";
      state.evidence[`session-${i}`] = evidenceSchema.parse({
        hints: 1,
        quizzes: {
          kuis: {
            attempts: i ? 1 : 2,
            incorrect: i ? 0 : 1,
            solved: true,
            firstTryCorrect: !!i,
          },
        },
      });
    }
    const model = buildProgressModel(state);
    expect(model.skills[2].probability).toBeCloseTo(1 / 3);
    expect(model.skills[3].probability).toBeCloseTo(2 / 3);
  });

  it("membatasi pembelajaran ke 20 sesi terbaru, berurutan menurut waktu penyelesaian", () => {
    const state = writingHistory([...Array(5).fill(0), ...Array(20).fill(90)]);
    state.sessions = Object.fromEntries(
      Object.entries(state.sessions).reverse(),
    );
    const skill = buildProgressModel(state).skills[1];
    expect(skill.totalSessions).toBe(25);
    expect(skill.history).toHaveLength(MODEL_CONFIG.maxSessions);
    expect(skill.alpha).toBe(21);
    expect(skill.beta).toBe(1);
    expect(skill.history[0].sessionId).toBe("session-5");
  });

  it("menjaga interval tetap finite dan memuat rata-rata pada semua hasil ekstrem", () => {
    for (const score of [0, 100]) {
      const item = buildProgressModel(writingHistory(Array(20).fill(score)))
        .skills[1];
      expect(item.interval![0]).toBeGreaterThanOrEqual(0);
      expect(item.interval![0]).toBeLessThan(item.probability!);
      expect(item.interval![1]).toBeGreaterThan(item.probability!);
      expect(item.interval![1]).toBeLessThanOrEqual(1);
    }
  });

  it("menyarankan keterampilan yang hasilnya paling perlu diulang, tanpa mengubah data", () => {
    const state = progressDemoData();
    const before = JSON.stringify(state);
    const model = buildProgressModel(state);
    expect(recommendPractice(model.skills).skill.id).toBe("fractions");
    expect(model.skills[1].trend).toBe("improving");
    expect(model.skills[3].probability).toBeNull();
    expect(JSON.stringify(state)).toBe(before);
    expect(
      buildProgressModel({ sessions: {}, evidence: {} }).assessedSessions,
    ).toBe(0);
  });
});
