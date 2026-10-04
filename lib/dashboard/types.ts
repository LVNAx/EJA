import type { RiskLevel, ScreeningScores } from "@/lib/screening/scoring";

export interface ChildProfile {
  id: string;
  name: string;
  grade: number | null;
  school: string | null;
  avatar: string | null;
}

export interface ScreeningRecord {
  id: string;
  childId: string;
  scores: ScreeningScores;
  riskScore: number;
  riskLevel: RiskLevel;
  completedAt: string;
  /** false = sesi tidak valid / terputus, tidak menghasilkan status (BR-04). */
  isValid: boolean;
  invalidReason: string | null;
}

export interface LessonRef {
  id: string;
  subject: string;
  unit: string;
  title: string;
}

export interface LearningSessionRecord {
  id: string;
  childId: string;
  lesson: LessonRef;
  startedAt: string;
  endedAt: string | null;
  xp: number;
}

export interface QuizRecord {
  sessionId: string;
  childId: string;
  isCorrect: boolean;
  /** Percobaan ke-berapa. Hanya percobaan pertama yang dihitung ke akurasi. */
  attempt: number;
  answeredAt: string;
}

export interface PracticeRecord {
  childId: string;
  kind: "write" | "speak";
  target: string;
  /** 0..1 */
  accuracy: number;
  syllablesTotal: number;
  syllablesCorrect: number;
  retries: number;
  createdAt: string;
}

export interface ChildData {
  profile: ChildProfile;
  screenings: ScreeningRecord[];
  sessions: LearningSessionRecord[];
  quizzes: QuizRecord[];
  practices: PracticeRecord[];
}

export type ChildStatus = "not-screened" | "needs-retest" | "screened" | "learning";

export type NotificationKind = "screening-complete" | "retest" | "inactive" | "quiz-drop";

export interface ParentNotification {
  id: string;
  childId: string;
  kind: NotificationKind;
  title: string;
  detail?: string;
  /** Tautan tindak lanjut di dasbor. */
  href?: string;
}
