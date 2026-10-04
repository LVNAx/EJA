import Link from "next/link";
import type { Lesson } from "./content";
import { Icon } from "@/features/learning/components/icons";
import { learningHref } from "@/features/learning/paths";

export function LessonCard({
  lesson,
  status,
  childId,
}: {
  lesson: Lesson;
  status: string;
  childId: string;
}) {
  return (
    <Link href={learningHref(childId, `/materi/${lesson.id}`)} className="lesson-card">
      <div className={`lesson-card-art ${lesson.icon}`} aria-hidden="true">
        {lesson.icon === "fraction" ? (
          <span className="quarter-art" />
        ) : (
          <span className="multiply-art">
            ✦ ✦<br />✦ ✦<br />✦ ✦
          </span>
        )}
      </div>
      <div className="lesson-card-body">
        <div className="lesson-meta">
          <span>
            <Icon name="clock" size={15} /> {lesson.durationMinutes} menit
          </span>
          <span className="status-pill">{status}</span>
        </div>
        <h3>{lesson.title}</h3>
        <p>{lesson.description}</p>
        <span className="card-link">
          {status === "Belum mulai"
            ? "Mulai belajar"
            : status === "Selesai"
              ? "Ulangi materi"
              : "Lanjutkan"}
          <Icon name="arrow" size={17} />
        </span>
      </div>
    </Link>
  );
}
