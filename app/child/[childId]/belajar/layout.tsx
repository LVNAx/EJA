import { AppShell } from "@/features/learning/components/app-shell";
import { openDyslexic } from "@/features/learning/font";
import "@/features/learning/styles/base.css";
import "@/features/learning/styles/literacy.css";
import "@/features/learning/styles/brand.css";

export const metadata = { title: "Belajar — EJA", robots: { index: false } };

export default async function LearningLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { childId: string };
}) {

  return (
    <div className={`learning-root ${openDyslexic.variable}`}>
      <AppShell childId={params.childId}>{children}</AppShell>
    </div>
  );
}
