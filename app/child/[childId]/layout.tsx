import { ChildAreaLayout } from "@/components/layout/ChildAreaLayout";
export const dynamic = "force-dynamic";
export default function ChildLayout({ children, params }: { children: React.ReactNode; params: { childId: string } }) {
  return <ChildAreaLayout childId={params.childId}>{children}</ChildAreaLayout>;
}
