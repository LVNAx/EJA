import { ChildAreaLayout } from "@/components/layout/ChildAreaLayout";
import "@/features/learning/styles/child-home.css";
export const dynamic = "force-dynamic";
export default function ChildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { childId: string };
}) {
  return <ChildAreaLayout childId={params.childId} allowPublicDemo>{children}</ChildAreaLayout>;
}
