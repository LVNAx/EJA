import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UNLOCK_COOKIE, verifyUnlock } from "./unlock";

/**
 * Lapisan kedua di samping middleware: data dasbor tidak pernah dibaca tanpa cookie buka-kunci yang sah,
 * walau suatu jalur lolos dari middleware (mis. dipanggil dari komponen lain).
 */
export async function requireParentUnlock(userId: string, next = "/dashboard"): Promise<void> {
  const token = cookies().get(UNLOCK_COOKIE)?.value;
  if (!(await verifyUnlock(token, userId))) redirect(`/unlock?next=${encodeURIComponent(next)}`);
}
